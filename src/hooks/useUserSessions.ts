// src/hooks/useUserSessions.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useUserSessions(userId: string | undefined) {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there's no user, we can't find sessions
    if (!userId) {
      setActiveSessions([]);
      setLoading(false);
      return;
    }

    async function fetchSessions() {
      setLoading(true);
      
      // We query the join table 'session_players' to find where the user is seated
      // then filter for sessions that are currently 'active'
      const { data, error } = await supabase
        .from('session_players')
        .select(`
          session_id,
          sessions!inner (
            id,
            short_code,
            vanity_name,
            status,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('sessions.status', 'active')
        .order('created_at', { foreignTable: 'sessions', ascending: false });

      if (!error && data) {
        // We flatten the response so it's a simple array of session objects
        setActiveSessions(data.map((d: any) => d.sessions));
      }
      
      setLoading(false);
    }

    fetchSessions();
  }, [userId]);

  return { activeSessions, loading };
}