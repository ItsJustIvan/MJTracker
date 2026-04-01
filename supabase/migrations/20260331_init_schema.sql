-- 1. TABLES & EXTENSIONS
-- ---------------------------------------------------------

-- Extend the sessions table with game state
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS scores INT[] DEFAULT '{0,0,0,0}',
ADD COLUMN IF NOT EXISTS current_dealer_idx INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS dealer_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create the Audit Trail for every hand
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    from_seat INT, -- 0, 1, 2, or 3
    to_seat INT,   -- 0, 1, 2, or 3
    amount INT,
    is_self_draw BOOLEAN DEFAULT FALSE,
    dealer_at_time INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CORE LOGIC: RECORD WIN (Every Hand)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION record_mahjong_win(
  p_session_id UUID,
  p_winner_idx INT,
  p_points INT, 
  p_loser_target TEXT -- '0','1','2','3' or 'all'
) RETURNS void AS $$
DECLARE
  v_dealer_idx INT;
  v_streak INT;
  v_tax INT;
  v_final_amount INT;
  v_total_win_for_hand INT := 0;
BEGIN
    -- 1. GET CURRENT STATE
    SELECT current_dealer_idx, dealer_streak 
    INTO v_dealer_idx, v_streak 
    FROM public.sessions WHERE id = p_session_id;

    -- Calculate Dealer Surcharge (1 + Streak)
    v_tax := 1 + v_streak;

    -- CASE A: SINGLE DISCARD (Chucker)
    IF p_loser_target != 'all' THEN
        v_final_amount := p_points;
        
        -- If Dealer WINS or Dealer LOSES, apply tax
        IF p_winner_idx = v_dealer_idx OR p_loser_target::INT = v_dealer_idx THEN
            v_final_amount := v_final_amount + v_tax;
        END IF;

        -- Record Transaction Entry
        INSERT INTO public.transactions (session_id, from_seat, to_seat, amount, is_self_draw, dealer_at_time)
        VALUES (p_session_id, p_loser_target::INT, p_winner_idx, v_final_amount, FALSE, v_dealer_idx);

        -- UPDATE THE SCORES ARRAY (Atomic index update)
        UPDATE public.sessions 
        SET scores[p_loser_target::INT + 1] = scores[p_loser_target::INT + 1] - v_final_amount,
            scores[p_winner_idx + 1] = scores[p_winner_idx + 1] + v_final_amount
        WHERE id = p_session_id;

    -- CASE B: SELF-DRAW (Zimo - Everyone Pays)
    ELSE
        FOR i IN 0..3 LOOP
            IF i != p_winner_idx THEN
                v_final_amount := p_points;
                
                -- Surcharge if winner is dealer OR payer is dealer
                IF p_winner_idx = v_dealer_idx OR i = v_dealer_idx THEN
                    v_final_amount := v_final_amount + v_tax;
                END IF;

                -- Record Transaction Entry
                INSERT INTO public.transactions (session_id, from_seat, to_seat, amount, is_self_draw, dealer_at_time)
                VALUES (p_session_id, i, p_winner_idx, v_final_amount, TRUE, v_dealer_idx);

                v_total_win_for_hand := v_total_win_for_hand + v_final_amount;

                -- Deduct from this payer
                UPDATE public.sessions 
                SET scores[i + 1] = scores[i + 1] - v_final_amount
                WHERE id = p_session_id;
            END IF;
        END LOOP;

        -- Add total loot to winner
        UPDATE public.sessions 
        SET scores[p_winner_idx + 1] = scores[p_winner_idx + 1] + v_total_win_for_hand
        WHERE id = p_session_id;
    END IF;

    -- 2. ROTATION & STREAK LOGIC
    IF p_winner_idx = v_dealer_idx THEN
        UPDATE public.sessions SET dealer_streak = dealer_streak + 1 WHERE id = p_session_id;
    ELSE
        UPDATE public.sessions SET current_dealer_idx = (v_dealer_idx + 1) % 4, dealer_streak = 0 WHERE id = p_session_id;
    END IF;

    -- 3. TIMESTAMP UPDATE
    UPDATE public.sessions SET updated_at = NOW() WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- 3. LEDGER LOGIC: FINALIZE SESSION (End of Game)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION finalize_mahjong_session(p_session_id UUID) 
RETURNS void AS $$
DECLARE
  v_seat RECORD;
  v_final_scores INT[];
  v_status TEXT;
BEGIN
    -- 1. Get current state
    SELECT scores, status INTO v_final_scores, v_status 
    FROM public.sessions WHERE id = p_session_id;

    -- 2. Prevent double-finalization
    IF v_status = 'closed' THEN RETURN; END IF;

    -- 3. Sync points to permanent profiles (Ghosts are ignored here)
    FOR v_seat IN 
        SELECT seat_index, user_id FROM public.session_players 
        WHERE session_id = p_session_id AND user_id IS NOT NULL
    LOOP
        UPDATE public.profiles 
        SET total_points = COALESCE(total_points, 0) + v_final_scores[v_seat.seat_index + 1],
            games_played = COALESCE(games_played, 0) + 1
        WHERE id = v_seat.user_id;
    END LOOP;

    -- 4. Mark session as closed
    UPDATE public.sessions SET status = 'closed', updated_at = NOW() WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;