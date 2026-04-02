-- 1. TABLES SETUP
-- Tracks the active Mahjong session
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active' or 'completed'
  settings JSONB DEFAULT '{"max_fan": 10, "double_dealer": true}'
);

-- Tracks the 4 seats at the table
CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  seat_index INT CHECK (seat_index BETWEEN 0 AND 3),
  profile_id UUID REFERENCES auth.users(id), -- Nullable for guests
  guest_name TEXT,
  score INT DEFAULT 0,
  is_dealer BOOLEAN DEFAULT false,
  UNIQUE(session_id, seat_index)
);

-- 2. THE SEATING ENGINE (RPC)
-- Handles "Frictionless Entry" for Guests and Auth Users
CREATE OR REPLACE FUNCTION claim_seat(
  target_session_id UUID,
  target_seat_index INT,
  p_guest_name TEXT DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE session_players
  SET 
    guest_name = p_guest_name,
    profile_id = p_profile_id
  WHERE 
    session_id = target_session_id 
    AND seat_index = target_seat_index;
END;
$$ LANGUAGE plpgsql;

-- 3. THE SCORING ENGINE (RPC)
-- The "Three-Tap" logic: Updates scores in a single transaction
CREATE OR REPLACE FUNCTION record_mahjong_hand(
  p_session_id UUID,
  p_winner_index INT,
  p_loser_index INT, -- Use -1 or NULL for "Self Draw" (Zimo)
  p_fan INT
)
RETURNS VOID AS $$
DECLARE
  base_points INT;
  is_zimo BOOLEAN := (p_loser_index IS NULL OR p_loser_index < 0);
BEGIN
  -- Standard HK Formula: 2^(Fan - 1)
  -- Note: You can adjust this math based on your specific house rules
  base_points := |/ (2 ^ (p_fan - 1)); 

  -- TRANSACTION START
  IF is_zimo THEN
    -- Winner collects from all 3 players
    -- (Simplification: 1x base from each. Adjust if dealer pays double)
    UPDATE session_players 
    SET score = score - base_points
    WHERE session_id = p_session_id AND seat_index != p_winner_index;

    UPDATE session_players
    SET score = score + (base_points * 3)
    WHERE session_id = p_session_id AND seat_index = p_winner_index;
  ELSE
    -- Winner collects from specific loser
    UPDATE session_players 
    SET score = score - base_points
    WHERE session_id = p_session_id AND seat_index = p_loser_index;

    UPDATE session_players
    SET score = score + base_points
    WHERE session_id = p_session_id AND seat_index = p_winner_index;
  END IF;
END;
$$ LANGUAGE plpgsql;