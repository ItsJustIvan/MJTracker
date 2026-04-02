'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useMahjongTable(sessionId: string, user: any, profile: any) {
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0);
  const [dealerStreak, setDealerStreak] = useState(0);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Initialize identity on mount
  useEffect(() => {
    setGuestId(localStorage.getItem('mahjong_guest_id'));
  }, []);

  const refreshScores = useCallback(async () => {
    const { data } = await supabase
      .from('session_scores')
      .select('seat_index, total_score')
      .eq('session_id', sessionId);
    
    if (data) {
      const newScores = [0, 0, 0, 0];
      data.forEach(row => { newScores[row.seat_index] = row.total_score; });
      setScores(newScores);
    }
  }, [sessionId]);

  const refreshSessionState = useCallback(async () => {
    const { data } = await supabase
      .from('sessions')
      .select('current_dealer_idx, dealer_streak, status')
      .eq('id', sessionId)
      .single();
    if (data) {
      setCurrentDealerIdx(data.current_dealer_idx);
      setDealerStreak(data.dealer_streak);
      setStatus(data.status);
    }
  }, [sessionId]);

  const refreshPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('session_players')
      .select(`
        seat_index, 
        profile_id,
        guest_name,
        guest_session_id,
        profiles (display_name, avatar_url)
      `)
      .eq('session_id', sessionId)
      .order('seat_index', { ascending: true });
    
    if (data) setSessionPlayers(data);
  }, [sessionId]);

const claimSeat = async (seatIndex: number, guestName?: string) => {
  // Relaxed status check
  if (status !== 'active' && status !== undefined) return;

  // Use state guestId primarily, fallback to localStorage
  const currentGuestId = guestId || localStorage.getItem('mahjong_guest_id');
  
  const existingPlayer = sessionPlayers.find(p => p.seat_index === seatIndex);
  const isCurrentlyMySeat = !!existingPlayer && (
    (user && existingPlayer.profile_id === user.id) || 
    (currentGuestId && existingPlayer.guest_session_id === currentGuestId)
  );

  const isLeaving = isCurrentlyMySeat && guestName === undefined;

  // 1. Handle Guest ID generation
  let effectiveGuestId = currentGuestId;
  if (!user && !effectiveGuestId && !isLeaving) {
    effectiveGuestId = crypto.randomUUID();
    localStorage.setItem('mahjong_guest_id', effectiveGuestId);
    setGuestId(effectiveGuestId); 
  }
  
  // 2. Call RPC
  const { error } = await supabase.rpc('sync_participant', {
    p_session_id: sessionId,
    p_seat_index: seatIndex,
    p_guest_name: isLeaving ? null : (user ? (profile?.display_name || 'Player') : (guestName || "Guest")),
    p_profile_id: isLeaving ? null : (user?.id || null),
    // Ensure we send null if it's a logged-in user to avoid type confusion
    p_guest_session_id: isLeaving ? null : (user ? null : (effectiveGuestId || null))
  });

if (error) {
    // 1. Log it for us
    console.error("Seating Error:", error.message);
    
    // 2. Show the sass to the user
    // Postgres errors often come with a prefix like "p_session_id: ERROR: ..." 
    // This regex or split helps clean it up to just the message
    const cleanMessage = error.message.replace(/^.*?:\s*/, '');
    alert(cleanMessage);
    
    refreshPlayers(); 
  }
  // Note: refreshPlayers() is handled by the Realtime subscription automatically
};

  const recordHand = async (payload: { 
    resultType: 'win' | 'dead_hand', 
    winnerIdx?: number | null, 
    points?: number, 
    isSelfDraw?: boolean, 
    loserIdx?: number | null 
  }) => {
    if (status !== 'active') return;

    const { error } = await supabase.rpc('execute_round', {
      p_session_id: sessionId,
      p_result_type: payload.resultType,
      p_winner_idx: payload.winnerIdx ?? null,
      p_points: payload.points ?? 0,
      p_is_self_draw: payload.isSelfDraw ?? false,
      p_loser_idx: payload.loserIdx ?? null
    });

    if (error) console.error("Scoring Error:", error.message);
  };

  const closeTable = async () => {
    const { error } = await supabase.rpc('seal_session', { 
      p_session_id: sessionId 
    });
    if (error) console.error("Close Table Error:", error);
  };

  const getWindForSeat = (seatIdx: number) => {
    const windOffset = (seatIdx - currentDealerIdx + 4) % 4;
    const windData = [
      { label: 'East', zh: '東' },
      { label: 'South', zh: '南' },
      { label: 'West', zh: '西' },
      { label: 'North', zh: '北' }
    ];
    return {
      label: windData[windOffset].label,
      zh: windData[windOffset].zh,
      isDealer: windOffset === 0
    };
  };

const permissions = {
  isAdmin: profile?.is_admin || false,
  isSeated: sessionPlayers.some(p => {
    const effectiveId = guestId || (typeof window !== 'undefined' ? localStorage.getItem('mahjong_guest_id') : null);
    return (user?.id && p.profile_id === user.id) || 
           (effectiveId && p.guest_session_id === effectiveId);
  }),
  canRecord: status === 'active'
};

  useEffect(() => {
    refreshScores(); 
    refreshSessionState(); 
    refreshPlayers();

    const channel = supabase.channel(`table_sync:${sessionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', schema: 'public', table: 'session_scores', 
        filter: `session_id=eq.${sessionId}` 
      }, () => refreshScores())
      .on('postgres_changes', { 
        event: 'UPDATE', schema: 'public', table: 'sessions', 
        filter: `id=eq.${sessionId}` 
      }, () => refreshSessionState())
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'session_players', 
        filter: `session_id=eq.${sessionId}` 
      }, () => refreshPlayers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refreshScores, refreshSessionState, refreshPlayers]);

  return {
    status,
    scores,
    sessionPlayers,
    currentDealerIdx,
    dealerStreak,
    permissions,
    guestId,
    setGuestId,
    claimSeat,
    recordHand,
    closeTable,
    getWindForSeat,
    profile
  };
}