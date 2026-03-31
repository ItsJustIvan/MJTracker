'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useMahjongSession(sessionId: string) {
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null); 
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0);
  const [dealerStreak, setDealerStreak] = useState(0);

  // --- REFRESH LOGIC ---

  const refreshScores = useCallback(async () => {
    const { data } = await supabase
      .from('session_scores')
      .select('player_idx, total_score')
      .eq('session_id', sessionId);
      
    if (data) {
      const newScores = [0, 0, 0, 0];
      data.forEach(row => { newScores[row.player_idx] = row.total_score; });
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
    // Crucial: We fetch guest_name and profile details together
    const { data } = await supabase
      .from('session_players')
      .select('profile_id, guest_name, seat_index, profiles(display_name, avatar_url)')
      .eq('session_id', sessionId);
    if (data) setSessionPlayers(data);
  }, [sessionId]);

  // --- HANDLERS ---

  const handleCloseTable = async () => {
    const { error } = await supabase.rpc('close_mahjong_session', { p_session_id: sessionId });
    if (error) {
      alert("Error closing table");
    } else {
      refreshSessionState();
    }
  };

  const handleUndo = async () => {
    const { error } = await supabase.rpc('undo_last_transaction', { p_session_id: sessionId });
    if (error) {
      alert("Error performing undo");
    } else {
      refreshScores();
      refreshSessionState();
    }
  };

  const handleClaimSeat = async (seatIndex: number, guestName?: string) => {
    if (status !== 'active') return;

    // Zero-friction: Use ID if logged in, otherwise use the nickname from the JoinModal
    const claimData = user 
      ? { session_id: sessionId, profile_id: user.id, seat_index: seatIndex }
      : { session_id: sessionId, guest_name: guestName, seat_index: seatIndex };

    const { error } = await supabase.from('session_players').insert([claimData]);

    if (error) {
      console.error("Error claiming seat:", error);
      return;
    }
    refreshPlayers();
  };

  const handleRemovePlayer = async (seatIndex: number) => {
    // Admin power: Forcefully clear a seat record
    const { error } = await supabase
      .from('session_players')
      .delete()
      .eq('session_id', sessionId)
      .eq('seat_index', seatIndex);

    if (error) {
      console.error("Error removing player:", error);
    } else {
      refreshPlayers();
    }
  };

  const handleRecordScore = async (winnerIdx: number, basePoints: number, loserIdx: number | 'all') => {
    if (status === 'closed') return;
    
    const { error } = await supabase.rpc('record_mahjong_win', {
      p_session_id: sessionId,
      p_winner_idx: winnerIdx,
      p_loser_target: loserIdx.toString(),
      p_points: basePoints,
      p_dealer_idx: currentDealerIdx
    });

    if (error) {
      console.error("Database Error:", error.message);
      alert("Failed to record score.");
    }
  };

  // --- PERMISSIONS LOGIC (Computed) ---
  const permissions = {
    isAdmin: profile?.is_admin || false,
    isSeated: sessionPlayers.some(p => p.profile_id === user?.id),
    canUndo: status === 'active' && (sessionPlayers.some(p => p.profile_id === user?.id) || profile?.is_admin),
    canClose: status === 'active' && (profile?.is_admin || sessionPlayers.length > 0),
    canReopen: status === 'closed' && (profile?.is_admin)
  };

  // --- EFFECTS ---

  useEffect(() => {
    // Initial Load
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch Admin Status
    if (user) {
      supabase.from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }

    refreshScores();
    refreshSessionState();
    refreshPlayers();

    // Realtime Channels
    const subTx = supabase.channel('tx').on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'transactions', 
      filter: `session_id=eq.${sessionId}` 
    }, () => {
      refreshScores();
      refreshSessionState();
    }).subscribe();

    const subSess = supabase.channel('sess').on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'sessions', 
      filter: `id=eq.${sessionId}` 
    }, () => refreshSessionState()).subscribe();
    
    const subPlay = supabase.channel('play').on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'session_players', 
      filter: `session_id=eq.${sessionId}` 
    }, () => refreshPlayers()).subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(subTx);
      supabase.removeChannel(subSess);
      supabase.removeChannel(subPlay);
    };
  }, [sessionId, user, refreshScores, refreshSessionState, refreshPlayers]);

  return { 
    user, 
    sessionPlayers, 
    scores, 
    currentDealerIdx, 
    dealerStreak, 
    status,
    permissions, 
    handleClaimSeat, 
    handleRemovePlayer,
    handleRecordScore, 
    handleCloseTable,
    handleUndo,
    refreshPlayers 
  };
}