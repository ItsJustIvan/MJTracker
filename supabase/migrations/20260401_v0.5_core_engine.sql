-- ==========================================
-- 1. CLEANUP & EXTENSIONS
-- ==========================================
DROP FUNCTION IF EXISTS record_mahjong_win CASCADE;
DROP FUNCTION IF EXISTS finalize_mahjong_session CASCADE;

-- ==========================================
-- 2. THE SCORING ENGINE (The Heart of the App)
-- ==========================================
CREATE OR REPLACE FUNCTION public.record_mahjong_hand(
  p_session_id UUID,
  p_winner_idx INT,
  p_is_self_draw BOOLEAN,
  p_points INT,
  p_loser_idx INT DEFAULT NULL -- Required if NOT self-draw
) RETURNS VOID AS $$
DECLARE
  v_rules JSONB;
  v_dealer_idx INT;
  v_dealer_streak INT;
  v_dealer_bonus INT := 0;
  v_total_loot INT := 0;
  v_payer_cost INT;
BEGIN
  -- 1. FETCH CURRENT STATE & RULES
  SELECT rules, current_dealer_idx, dealer_streak 
  INTO v_rules, v_dealer_idx, v_dealer_streak 
  FROM public.sessions WHERE id = p_session_id;

  -- 2. VALIDATE STATUS
  IF (SELECT status FROM public.sessions WHERE id = p_session_id) = 'closed' THEN
    RAISE EXCEPTION 'This session is closed and cannot record new scores.';
  END IF;

  -- 3. VALIDATE MINIMUM POINTS
  IF p_points < (v_rules->>'min_points')::int THEN
    RAISE EXCEPTION 'Hand does not meet table minimum of % points', (v_rules->>'min_points');
  END IF;

  -- 4. CALCULATE DEALER BONUS (1 + (2 * Streak))
  -- Only applied if enabled in the table rules
  IF (v_rules->>'dealer_points_enabled')::boolean = true THEN
     v_dealer_bonus := (v_rules->>'base_dealer_bonus')::int + 
                       ((v_rules->>'streak_multiplier')::int * v_dealer_streak);
  END IF;

  -- 5. THE MATH LOGIC
  IF p_is_self_draw THEN
    -- CASE A: SELF-DRAW (Zimo)
    FOR i IN 0..3 LOOP
      IF i != p_winner_idx THEN
        v_payer_cost := p_points;
        
        -- Apply dealer surcharge if winner is dealer OR payer is dealer
        IF p_winner_idx = v_dealer_idx OR i = v_dealer_idx THEN
           v_payer_cost := v_payer_cost + v_dealer_bonus;
        END IF;

        -- Deduct from Payer
        UPDATE public.session_scores 
        SET total_score = total_score - v_payer_cost
        WHERE session_id = p_session_id AND seat_index = i;

        v_total_loot := v_total_loot + v_payer_cost;

        -- Record Individual Transaction
        INSERT INTO public.transactions (
          session_id, winner_seat_index, loser_seat_index, 
          points_value, is_self_draw, dealer_at_time, dealer_bonus_applied, hand_type
        ) VALUES (
          p_session_id, p_winner_idx, i, p_points, TRUE, v_dealer_idx, 
          CASE WHEN (p_winner_idx = v_dealer_idx OR i = v_dealer_idx) THEN v_dealer_bonus ELSE 0 END,
          'self_draw'
        );
      END IF;
    END LOOP;
  ELSE
    -- CASE B: DIRECT WIN (Chucker)
    v_payer_cost := p_points;

    -- Apply surcharge if winner or loser is dealer
    IF p_winner_idx = v_dealer_idx OR p_loser_idx = v_dealer_idx THEN
       v_payer_cost := v_payer_cost + v_dealer_bonus;
    END IF;

    -- Update Loser
    UPDATE public.session_scores 
    SET total_score = total_score - v_payer_cost
    WHERE session_id = p_session_id AND seat_index = p_loser_idx;

    v_total_loot := v_payer_cost;

    -- Record Transaction
    INSERT INTO public.transactions (
      session_id, winner_seat_index, loser_seat_index, 
      points_value, is_self_draw, dealer_at_time, dealer_bonus_applied, hand_type
    ) VALUES (
      p_session_id, p_winner_idx, p_loser_idx, p_points, FALSE, v_dealer_idx, 
      CASE WHEN (p_winner_idx = v_dealer_idx OR p_loser_idx = v_dealer_idx) THEN v_dealer_bonus ELSE 0 END,
      'direct_win'
    );
  END IF;

  -- 6. ADD LOOT TO WINNER
  UPDATE public.session_scores 
  SET total_score = total_score + v_total_loot
  WHERE session_id = p_session_id AND seat_index = p_winner_idx;

  -- 7. ROTATION & STREAK LOGIC
  IF p_winner_idx = v_dealer_idx THEN
      UPDATE public.sessions SET dealer_streak = dealer_streak + 1 WHERE id = p_session_id;
  ELSE
      UPDATE public.sessions 
      SET current_dealer_idx = (v_dealer_idx + 1) % 4, 
          dealer_streak = 0 
      WHERE id = p_session_id;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. THE FINALIZER (Moving Points to Profiles)
-- ==========================================
CREATE OR REPLACE FUNCTION public.finalize_session_v5(p_session_id UUID) 
RETURNS VOID AS $$
DECLARE
  v_rec RECORD;
BEGIN
  -- 1. Logic check: Is it already closed?
  IF (SELECT status FROM public.sessions WHERE id = p_session_id) = 'closed' THEN
    RETURN;
  END IF;

  -- 2. Move scores to Profiles for any non-ghost players
  FOR v_rec IN 
    SELECT sp.profile_id, ss.total_score 
    FROM public.session_players sp
    JOIN public.session_scores ss ON sp.session_id = ss.session_id AND sp.seat_index = ss.seat_index
    WHERE sp.session_id = p_session_id AND sp.profile_id IS NOT NULL
  LOOP
    UPDATE public.profiles 
    SET total_wins = CASE WHEN v_rec.total_score > 0 THEN total_wins + 1 ELSE total_wins END,
        total_games_played = total_games_played + 1
        -- Add career point accumulation here if desired
    WHERE id = v_rec.profile_id;
  END LOOP;

  -- 3. Close the session
  UPDATE public.sessions SET status = 'closed' WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;