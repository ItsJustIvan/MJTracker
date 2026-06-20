-- Migration: Add roles and events management
-- Created at: 2026-06-14

-- Create the event_registrations table if it does not exist
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

-- Add short_code to public.events if it does not exist
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS short_code text UNIQUE;

-- Add is_competitive to public.sessions if it does not exist
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS is_competitive boolean NOT NULL DEFAULT false;

-- --- RLS Policies for event_registrations --- 

-- Enable RLS on event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can register themselves for an event
DROP POLICY IF EXISTS "Users can register for an event" ON public.event_registrations;
CREATE POLICY "Users can register for an event" ON public.event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- Policy: Registered users can view their own event registrations
DROP POLICY IF EXISTS "Users can view their own event registrations" ON public.event_registrations;
CREATE POLICY "Users can view their own event registrations" ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

-- Policy: Admins/Moderators can view all event registrations
DROP POLICY IF EXISTS "Admins and Moderators can view all event registrations" ON public.event_registrations;
CREATE POLICY "Admins and Moderators can view all event registrations" ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- Policy: Admins/Moderators can delete any event registration
DROP POLICY IF EXISTS "Admins and Moderators can delete event registrations" ON public.event_registrations;
CREATE POLICY "Admins and Moderators can delete event registrations" ON public.event_registrations
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- --- RLS Policies for sessions competitive state ---

-- Policy: Admins/Moderators can update session competitive status
DROP POLICY IF EXISTS "Admins and Moderators can update session competitive status" ON public.sessions;
CREATE POLICY "Admins and Moderators can update session competitive status" ON public.sessions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));


-- --- Create multi-table helper function ---

CREATE OR REPLACE FUNCTION public.create_event_tables(
  p_event_id uuid,
  p_count integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.user_role;
  i integer;
BEGIN
  -- Authenticate & authorize the creator as admin or moderator
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and moderators can provision tables.';
  END IF;

  FOR i IN 1..p_count LOOP
    INSERT INTO public.sessions (
      event_id,
      hand_number,
      prevalent_wind,
      current_dealer_idx,
      dealer_streak,
      status,
      is_competitive
    ) VALUES (
      p_event_id,
      1,
      0, -- East Wind
      0, -- First Dealer Seat
      0,
      'active',
      true -- Default competitive/locked for tournament tables
    );
  END LOOP;
END;
$$;

-- Grant execute permissions to authenticated users
REVOKE EXECUTE ON FUNCTION public.create_event_tables(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_event_tables(uuid, integer) TO authenticated;
