'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useMahjongSession(sessionId: string) {
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [user, setUser] = useState<User | null>(null);
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0);
  const [dealerStreak, setDealerStreak] = useState(0);

  const refreshScores = useCallback(async () => {
    const { data } = await supabase.from('session_scores').select('player_idx, total_score').eq('session_id', sessionId);
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
    const { data } = await supabase.from('session_players').select('profile_id, seat_index, profiles(display_name, avatar_url)').eq('session_id', sessionId);
    if (data) setSessionPlayers(data);
  }, [sessionId]);

  const handleCloseTable = async () => {
    const { error } = await supabase.rpc('close_mahjong_session', { p_session_id: sessionId });
    if (error) {
      alert("Error closing table");
    } else {
      // The realtime listener should pick this up, but we refresh locally for speed
      refreshSessionState();
    }
  };

  const handleClaimSeat = async (seatIdx: number) => {
    if (!user || status === 'closed') return false;
    const existingSeat = sessionPlayers.find(p => p.profile_id === user.id);
    if (existingSeat) {
      if (existingSeat.seat_index === seatIdx) return true;
      await supabase.from('session_players').delete().eq('session_id', sessionId).eq('profile_id', user.id);
    }
    await supabase.from('session_players').insert({ session_id: sessionId, profile_id: user.id, seat_index: seatIdx });
    return true;
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    refreshScores();
    refreshSessionState();
    refreshPlayers();

    const subTx = supabase.channel('tx').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `session_id=eq.${sessionId}` }, () => refreshScores()).subscribe();
    const subSess = supabase.channel('sess').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, () => refreshSessionState()).subscribe();
    const subPlay = supabase.channel('play').on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` }, () => refreshPlayers()).subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(subTx);
      supabase.removeChannel(subSess);
      supabase.removeChannel(subPlay);
    };
  }, [sessionId, refreshScores, refreshSessionState, refreshPlayers]);

  return { 
    user, 
    sessionPlayers, 
    scores, 
    currentDealerIdx, 
    dealerStreak, 
    status,
    handleClaimSeat, 
    handleRecordScore, 
    handleCloseTable,
    refreshPlayers 
  };
}