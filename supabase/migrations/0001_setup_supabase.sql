-- RLS Policies (Deny-by-default)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sessions FROM anon, authenticated;
CREATE POLICY "deny_select_sessions" ON public.sessions FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_sessions" ON public.sessions FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_sessions" ON public.sessions FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_sessions" ON public.sessions FOR DELETE TO anon, authenticated USING (false);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM anon, authenticated;
CREATE POLICY "deny_select_profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_profiles" ON public.profiles FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_profiles" ON public.profiles FOR DELETE TO anon, authenticated USING (false);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.events FROM anon, authenticated;
CREATE POLICY "deny_select_events" ON public.events FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_events" ON public.events FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_events" ON public.events FOR DELETE TO anon, authenticated USING (false);

ALTER TABLE public.event_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_permissions FROM anon, authenticated;
CREATE POLICY "deny_select_event_permissions" ON public.event_permissions FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_event_permissions" ON public.event_permissions FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_event_permissions" ON public.event_permissions FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_event_permissions" ON public.event_permissions FOR DELETE TO anon, authenticated USING (false);

ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session_players FROM anon, authenticated;
CREATE POLICY "deny_select_session_players" ON public.session_players FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_session_players" ON public.session_players FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_session_players" ON public.session_players FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_session_players" ON public.session_players FOR DELETE TO anon, authenticated USING (false);

ALTER TABLE public.session_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session_scores FROM anon, authenticated;
CREATE POLICY "deny_select_session_scores" ON public.session_scores FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_session_scores" ON public.session_scores FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_session_scores" ON public.session_scores FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_session_scores" ON public.session_scores FOR DELETE TO anon, authenticated USING (false);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.transactions FROM anon, authenticated;
CREATE POLICY "deny_select_transactions" ON public.transactions FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_transactions" ON public.transactions FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_transactions" ON public.transactions FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_transactions" ON public.transactions FOR DELETE TO anon, authenticated USING (false);

ALTER TABLE public.event_standings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_standings FROM anon, authenticated;
CREATE POLICY "deny_select_event_standings" ON public.event_standings FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "deny_insert_event_standings" ON public.event_standings FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_event_standings" ON public.event_standings FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_event_standings" ON public.event_standings FOR DELETE TO anon, authenticated USING (false);

-- Centralized permission resolver
CREATE OR REPLACE FUNCTION auth.check_event_permission(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT ep.role::text
      FROM public.sessions s
      JOIN public.event_permissions ep
        ON ep.event_id = s.event_id
      WHERE s.id = p_session_id
        AND ep.profile_id = p_user_id
      LIMIT 1
    ),
    'player'::text
  );
$$;

REVOKE EXECUTE ON FUNCTION auth.check_event_permission(uuid, uuid) FROM anon, authenticated;

-- Read-Only RPCs
CREATE OR REPLACE FUNCTION public.get_session_scoreboard(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_out jsonb;
BEGIN
  -- Auth gate
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_role := auth.check_event_permission(p_session_id, v_uid);

  IF v_role NOT IN ('player','scorekeeper','organizer') THEN
    RAISE EXCEPTION 'No permission to read scoreboard';
  END IF;

  SELECT jsonb_build_object(
    'session_id', s.id,
    'hand_number', s.hand_number,
    'prevalent_wind', s.prevalent_wind,
    'current_dealer_idx', s.current_dealer_idx,
    'dealer_streak', s.dealer_streak,
    'players', (
      SELECT jsonb_agg(jsonb_build_object(
        'seat_index', sp.seat_index,
        'profile_id', sp.profile_id,
        'is_ready', sp.is_ready,
        'guest_name', sp.guest_name
      ) ORDER BY sp.seat_index)
      FROM public.session_players sp
      WHERE sp.session_id = s.id
    ),
    'scores', (
      SELECT jsonb_agg(jsonb_build_object(
        'seat_index', sc.seat_index,
        'total_score', sc.total_score
      ) ORDER BY sc.seat_index)
      FROM public.session_scores sc
      WHERE sc.session_id = s.id
    )
  )
  INTO v_out
  FROM public.sessions s
  WHERE s.id = p_session_id;

  IF v_out IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  RETURN v_out;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_session_scoreboard(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_session_scoreboard(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_event_standings(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_out jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_role := (
    SELECT COALESCE((SELECT role::text
      FROM public.event_permissions ep
      WHERE ep.event_id = p_event_id AND ep.profile_id = v_uid
      LIMIT 1),
    'player'::text)
  );

  IF v_role NOT IN ('player','scorekeeper','organizer') THEN
    RAISE EXCEPTION 'No permission to read standings';
  END IF;

  SELECT jsonb_build_object(
    'event_id', e.id,
    'standings', (
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', es.user_id,
        'final_table_score', es.final_table_score,
        'rank_position', es.rank_position,
        'league_points_earned', es.league_points_earned,
        'session_id', es.session_id
      ) ORDER BY es.rank_position)
      FROM public.event_standings es
      WHERE es.event_id = e.id
    )
  )
  INTO v_out
  FROM public.events e
  WHERE e.id = p_event_id;

  IF v_out IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  RETURN v_out;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_standings(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_event_standings(uuid) TO authenticated;

-- Mutating RPCs (record_hand example)
CREATE OR REPLACE FUNCTION public.record_hand(
  p_session_id uuid,
  p_winner_seat_index int,
  p_loser_seat_index int,
  p_points int,
  p_is_self_draw boolean,
  p_dealer_at_time int,
  p_result_type text,
  p_dealer_streak_at_time int,
  p_dealer_points_applied int,
  p_prevalent_wind_at_time int,
  p_is_dealer_points_on boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_strict boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_role := auth.check_event_permission(p_session_id, v_uid);

  IF v_role NOT IN ('scorekeeper','organizer') THEN
    RAISE EXCEPTION 'Forbidden: role % cannot record hand', v_role;
  END IF;

  SELECT (e.settings->>'strict_scoring')::boolean
  INTO v_strict
  FROM public.sessions s
  JOIN public.events e ON e.id = s.event_id
  WHERE s.id = p_session_id;

  IF v_strict IS NULL THEN
    v_strict := false;
  END IF;

  IF p_result_type NOT IN ('win','self_draw','dead_hand','adjustment') THEN
    RAISE EXCEPTION 'Invalid result_type';
  END IF;

  IF p_winner_seat_index < 0 OR p_winner_seat_index > 3 THEN
    RAISE EXCEPTION 'Bad winner seat';
  END IF;

  BEGIN
    INSERT INTO public.transactions(
      session_id,
      winner_seat_index,
      loser_seat_index,
      points,
      is_self_draw,
      dealer_at_time,
      result_type,
      dealer_streak_at_time,
      dealer_points_applied,
      is_adjustment,
      prevalent_wind_at_time,
      is_dealer_points_on
    ) VALUES (
      p_session_id,
      p_winner_seat_index,
      p_loser_seat_index,
      p_points,
      p_is_self_draw,
      p_dealer_at_time,
      p_result_type,
      p_dealer_streak_at_time,
      p_dealer_points_applied,
      (p_result_type = 'adjustment'),
      p_prevalent_wind_at_time,
      p_is_dealer_points_on
    );

    -- PERFORM public._apply_record_hand_effects(p_session_id, ...);
    -- PERFORM public._update_session_state_after_hand(p_session_id);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;

END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_hand(uuid, int, int, int, boolean, int, text, int, int, int, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_hand(uuid, int, int, int, boolean, int, text, int, int, int, boolean) TO authenticated;

-- Realtime private broadcast trigger
CREATE OR REPLACE FUNCTION public.broadcast_room_hand_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM realtime.send(
    'room:' || NEW.session_id::text,
    'hand_recorded',
    jsonb_build_object(
      'session_id', NEW.session_id,
      'transaction_id', NEW.id,
      'result_type', NEW.result_type,
      'points', NEW.points,
      'winner_seat_index', NEW.winner_seat_index,
      'loser_seat_index', NEW.loser_seat_index
    ),
    true -- private
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_broadcast_room_hand_record ON public.transactions;

CREATE TRIGGER tr_broadcast_room_hand_record
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_room_hand_record();


