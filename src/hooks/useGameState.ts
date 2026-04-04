'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useGameState(sessionId: string) {
  const [tableData, setTableData] = useState<any>(null);
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  
  // Derived state from tableData for easier access in UI
  const currentDealerIdx = tableData?.current_dealer_idx ?? 0;
  const dealerStreak = tableData?.dealer_streak ?? 0;
  const prevalentWind = tableData?.prevalent_wind ?? 0;
  const handNumber = tableData?.hand_number ?? 1; // Defensive fallback

  /**
   * REFRESH SESSION STATE
   * Pulls the "Big Picture" game state from the sessions table.
   */
  const refreshSessionState = useCallback(async () => {
    if (!sessionId) return;
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (error) {
      console.error("🚫 [useGameState] Fetch Error:", error.message);
      return;
    }

    if (data) {
      setTableData(data);
      setStatus(data.status);
    }
  }, [sessionId]);

  /**
   * ACTION: RECORD HAND
   * The primary state-changer for the game.
   */
  const recordHand = async (payload: {
    winnerIdx: number | null;
    loserIdx: number | 'all' | null;
    points: number;
    resultType: 'win' | 'dead_hand' | 'adjustment' | 'self_draw';
  }) => {
    if (status !== 'active') return;

    const { error } = await supabase.rpc('record_hand', {
      p_session_id: sessionId,
      p_winner_idx: payload.winnerIdx,
      p_loser_idx: payload.loserIdx?.toString() || (payload.resultType === 'dead_hand' ? null : 'all'),
      p_points: payload.points || 0,
      p_result_type: payload.resultType
    });

    if (error) {
      console.error("🚫 [useGameState] Record Hand Error:", error.message);
    } else {
      // We don't refresh history/scores here; their respective hooks will 
      // see the transaction and refresh themselves.
      await refreshSessionState();
    }
  };

  /**
   * UTILITY: GET WIND FOR SEAT
   * Pure logic to determine a player's wind based on the current dealer.
   */
  const getWindForSeat = (seatIdx: number) => {
    const windOffset = (seatIdx - currentDealerIdx + 4) % 4;
    const windData = [
      { label: 'East', zh: '東' },
      { label: 'South', zh: '南' },
      { label: 'West', zh: '西' },
      { label: 'North', zh: '北' }
    ];
    return { ...windData[windOffset], isDealer: windOffset === 0 };
  };

  /**
   * SUBSCRIPTION
   * Listens ONLY to the sessions table for updates.
   */
  useEffect(() => {
    refreshSessionState();

    const channel = supabase.channel(`game_state:${sessionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'sessions', 
        filter: `id=eq.${sessionId}` 
      }, () => refreshSessionState())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refreshSessionState]);

  return {
    tableData,
    status,
    currentDealerIdx,
    dealerStreak,
    prevalentWind,
    handNumber,
    recordHand,
    getWindForSeat,
    closeTable: async () => { await supabase.rpc('seal_session', { p_session_id: sessionId }); },
    refreshSessionState
  };
}