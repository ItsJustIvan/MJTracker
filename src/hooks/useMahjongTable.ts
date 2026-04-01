'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useMahjongTable(sessionId: string, user: any, profile: any) {
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0);
  const [dealerStreak, setDealerStreak] = useState(0);

  // --- REFRESH LOGIC (Targeted) ---
  
  const refreshScores = useCallback(async () => {
    const { data } = await supabase
      .from('session_scores')
      .select('seat_index, total_score')
      .eq('session_id', sessionId);
    
    if (data) {
      const newScores = [0, 0, 0, 0];
      data.forEach(row => { 
        newScores[row.seat_index] = row.total_score; 
      });
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
        is_ready,
        profile_id,
        profiles (
          display_name, 
          avatar_url
        )
      `)
      .eq('session_id', sessionId)
      .order('seat_index', { ascending: true });
    
    if (data) setSessionPlayers(data);
  }, [sessionId]);

  // --- HANDLERS (RPC Powered) ---

const handleClaimSeat = async (seatIndex: number) => {
    if (status !== 'active' || !user) return;

    // 🗝️ FIXED: Removed the accidental 'record_mahjong_hand' call from here
    // Use the correct 'claim_seat' RPC
    const { error } = await supabase.rpc('claim_seat', {
      p_session_id: sessionId,
      p_seat_index: seatIndex,
      p_profile_id: user.id
    });

    if (error) console.error("Claim Seat Error:", error);
  };

const handleRecordScore = async (payload: { 
    winnerIdx: number, 
    isSelfDraw: boolean, 
    points: number, 
    loserIdx?: number | null 
  }) => {
    if (status !== 'active') return;

    // 🗝️ This is where 'payload' actually exists
    const { error } = await supabase.rpc('record_mahjong_hand', {
      p_session_id: sessionId,
      p_winner_idx: payload.winnerIdx,
      p_is_self_draw: payload.isSelfDraw,
      p_points: payload.points,
      p_loser_idx: payload.isSelfDraw ? null : payload.loserIdx
    });

    if (error) console.error("Score Recording Error:", error);
  };

  const handleCloseTable = async () => {
    const { error } = await supabase.rpc('finalize_session_v5', { 
      p_session_id: sessionId 
    });
    if (error) console.error("Close Table Error:", error);
  };

  // --- PERMISSIONS ---
  const permissions = {
    isAdmin: profile?.is_admin || false,
    isSeated: sessionPlayers.some(p => p.profile_id === user?.id),
    mySeatIndex: sessionPlayers.find(p => p.profile_id === user?.id)?.seat_index,
    canRecord: status === 'active' && sessionPlayers.some(p => p.profile_id === user?.id)
  };

  // --- REALTIME ORCHESTRATION ---
  useEffect(() => {
    // Initial Load
    refreshScores(); 
    refreshSessionState(); 
    refreshPlayers();

    const channel = supabase.channel(`realtime:table:${sessionId}`)
      // 1. Listen for Score Changes (The "Money" moves)
// Temporarily change this:
.on('postgres_changes', { 
  event: 'UPDATE', 
  schema: 'public', 
  table: 'session_scores' 
  // 🗝️ Comment out the filter for a second
  // filter: `session_id=eq.${sessionId}` 
}, (payload) => {
  console.log("🔥 ANY SCORE UPDATE:", payload);
  refreshScores();
})
      
      // 2. Listen for Session State (Dealer rotation, streaks, closing)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'sessions', 
        filter: `id=eq.${sessionId}` 
      }, () => refreshSessionState())
      
      // 3. Listen for Player Changes (Claiming seats / Substitutions)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'session_players', 
        filter: `session_id=eq.${sessionId}` 
      }, () => refreshPlayers())
      
      .subscribe((status) => {
  console.log("📡 Realtime Status:", status);
  if (status !== 'SUBSCRIBED') {
    console.warn("📡 Realtime notice:", status);
  }
});

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refreshScores, refreshSessionState, refreshPlayers]);

  return {
    status,
    scores,
    sessionPlayers,
    currentDealerIdx,
    dealerStreak,
    permissions,
    handleClaimSeat,
    handleRecordScore,
    handleCloseTable
  };
}