'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useGameState(sessionId: string) {
  const [tableData, setTableData] = useState<any>(null);
  const [status, setStatus] = useState<'active' | 'closed' | 'archived'>('active');
  
  // 1. Derived state: Clean, typed access to the "Big Picture"
  const currentDealerIdx = tableData?.current_dealer_idx ?? 0;
  const dealerStreak = tableData?.dealer_streak ?? 0;
  const prevalentWind = tableData?.prevalent_wind ?? 0;
  const handNumber = tableData?.hand_number ?? 1;

  /**
   * REFRESH SESSION STATE
   * The single source of truth for the "Current Hand" context.
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
   * UTILITY: GET WIND FOR SEAT
   * Logic to determine a player's wind based on current dealer.
   * This stays here because it is a direct calculation of the state.
   */
  const getWindForSeat = useCallback((seatIdx: number) => {
    const windOffset = (seatIdx - currentDealerIdx + 4) % 4;
    const windData = [
      { label: 'East', zh: '東' },
      { label: 'South', zh: '南' },
      { label: 'West', zh: '西' },
      { label: 'North', zh: '北' }
    ];
    return { ...windData[windOffset], isDealer: windOffset === 0 };
  }, [currentDealerIdx]);

  /**
   * closeTable
   */
  const closeTable = useCallback(async () => {
    if (!sessionId) return;
    
    const { error } = await supabase.rpc('seal_session', { 
      p_session_id: sessionId 
    });

    if (error) {
      console.error("🚫 [useGameState] Close Table Error:", error.message);
      return { success: false, error };
    }
    
    // Status will update automatically via the Postgres subscription
    return { success: true };
  }, [sessionId]);

  /**
   * SUBSCRIPTION
   * Listens for any UPDATE to the sessions table (dealer rotation, etc.)
   */
  useEffect(() => {
    refreshSessionState();

    const channel = supabase.channel(`game_state:${sessionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'sessions', 
        filter: `id=eq.${sessionId}` 
      }, () => {
        console.log("🔄 [useGameState] Table state updated remotely...");
        refreshSessionState();
      })
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
    getWindForSeat,
    refreshSessionState,
    closeTable
  };
}