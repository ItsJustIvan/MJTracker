'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useSessionPlayers(sessionId: string) {
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * REFRESH PLAYERS
   * Fetches the 4 seats and joins the profile data for whoever is sitting there.
   */
  const refreshPlayers = useCallback(async () => {
    if (!sessionId) return;
    
    const { data, error } = await supabase
      .from('session_players')
      .select(`
        id,
        seat_index, 
        profile_id,
        guest_name,
        guest_session_id,
        is_ready,
        profiles (display_name, avatar_url)
      `)
      .eq('session_id', sessionId)
      .order('seat_index', { ascending: true });
    
    if (error) {
      console.error("🚫 [useSessionPlayers] Fetch Error:", error.message);
    } else {
      setSessionPlayers(data || []);
    }
    setLoading(false);
  }, [sessionId]);

  /**
   * ACTION: CLAIM / MOVE / LEAVE
   * Calls the Bucket B RPC. This logic handles:
   * 1. Sitting in an empty ghost seat.
   * 2. Moving from Seat 0 to Seat 2 (and vacating 0).
   * 3. Leaving the table entirely.
   */
  const claimSeat = async (params: {
    seatIndex: number;
    userId?: string | null;
    guestId: string | null;
    guestName?: string;
    isVacating?: boolean;
  }) => {
    const { seatIndex, userId, guestId, guestName, isVacating = false } = params;

    const { error } = await supabase.rpc('claim_seat_v2', {
      p_session_id: sessionId,
      p_seat_index: seatIndex,
      p_profile_id: userId || null,
      p_guest_session_id: guestId,
      p_guest_name: guestName || "Guest",
      p_is_vacating: isVacating
    });

    if (error) {
      console.error("🚫 [useSessionPlayers] Seating Error:", error.message);
      return { success: false, error };
    }

    // Realtime will usually catch this, but we refresh for immediate UI snappiness
    await refreshPlayers();
    return { success: true };
  };

  /**
   * SUBSCRIPTION
   * Listens for any changes to the session_players table for this session.
   */
  useEffect(() => {
    refreshPlayers();

    const channel = supabase.channel(`table_players:${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'session_players', 
        filter: `session_id=eq.${sessionId}` 
      }, () => refreshPlayers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refreshPlayers]);

  return {
    sessionPlayers,
    loading,
    claimSeat,
    refreshPlayers
  };
}