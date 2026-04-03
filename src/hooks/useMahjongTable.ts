'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useMahjongTable(sessionId: string, user: any, profile: any) {
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0);
  const [dealerStreak, setDealerStreak] = useState(0);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any>(null);

  // Prevents the migration/handover from firing multiple times during state transitions
  const isUpgrading = useRef(false);

  /**
   * 1. IDENTITY INITIALIZATION
   * Ensures every visitor has a unique Guest UUID in localStorage immediately.
   * This is the "Primary Key" for unidentified players until they log in.
   */
  useEffect(() => {
    let id = localStorage.getItem('mahjong_guest_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('mahjong_guest_id', id);
    }
    setGuestId(id);
  }, []);

  /**
   * 2. DATA REFRESH FUNCTIONS
   * Pure "Get" functions to sync local state with Postgres tables.
   */
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
  // 🎯 CRITICAL: We must destructure 'error' here so line 55 can see it
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
    
  // Now this line will work perfectly!
  console.log("🛠️ AUDIT 2 (DB Result):", { data, error });
    
  if (error) {
    console.error("🚫 Supabase Fetch Error:", error.message);
    return;
  }

  if (data) {
    setCurrentDealerIdx(data.current_dealer_idx);
    setDealerStreak(data.dealer_streak);
    setStatus(data.status);
    setTableData(data); // 🚀 This will now fire and update the UI
  }
}, [sessionId]);    

console.log("🛠️ AUDIT 3 (Hook Export):", { tableData });

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

  /**
   * 3. GLOBAL IDENTITY HANDOVER
   * Listens for the 'user' object (login). When detected, it tells the backend
   * to find every instance of this browser's Guest ID and replace it with the 
   * new Profile ID. This syncs the player across all their active tables.
   */
  useEffect(() => {
    const performMigration = async () => {
      const localGuestId = localStorage.getItem('mahjong_guest_id');
      
      // Guard: Only run if we have an authenticated user and a guest ID to "upgrade"
      if (user?.id && localGuestId && !isUpgrading.current) {
        // Double-check if the user is actually sitting at THIS table as a guest
        const isCurrentlyGuestHere = sessionPlayers.some(
          p => p.guest_session_id === localGuestId && !p.profile_id
        );

        if (isCurrentlyGuestHere) {
          isUpgrading.current = true;
          console.log("🚀 [CTO Handover]: Migrating Guest ID to Profile...");
          
          const { error } = await supabase.rpc('migrate_guest_to_player', {
            p_guest_session_id: localGuestId,
            p_profile_id: user.id
          });

          if (error) {
            console.error("🚫 [Migration Error]:", error.message);
          } else {
            // Success: Local data is now stale, fetch the new Profile-owned rows
            await refreshPlayers();
          }
          isUpgrading.current = false;
        }
      }
    };

    performMigration();
  }, [user, sessionPlayers, refreshPlayers]);

  /**
   * 4. ACTION: CLAIM / MOVE / LEAVE
   * The primary interaction function. Handles:
   * - Claiming an empty seat
   * - Moving from one seat to another (Auto-vacates old seat)
   * - Leaving a seat (if isVacating is true)
   */
  const claimSeat = async (seatIndex: number, name?: string, isVacating: boolean = false) => {
    // CRITICAL GUARD: Prevents 'null value violates constraint' errors
    if (seatIndex === null || seatIndex === undefined) {
      console.warn("⚠️ [Claim Seat]: Blocked call with null seatIndex.");
      return;
    }

    const currentGuestId = localStorage.getItem('mahjong_guest_id');
    const storedName = localStorage.getItem('mahjong_guest_name');
    
    // Identity Hierarchy: Manual Input > Local Storage > Default
    const finalName = name || storedName || "Guest";
    if (name) localStorage.setItem('mahjong_guest_name', name);

    const { error } = await supabase.rpc('claim_seat_v2', {
      p_session_id: sessionId,
      p_seat_index: seatIndex,
      p_profile_id: user?.id || null,
      p_guest_session_id: currentGuestId,
      p_guest_name: finalName,
      p_is_vacating: isVacating
    });

    if (error) {
      console.error("🚫 [Seating Error]:", error.message);
    } else {
      await refreshPlayers();
    }
  };

  /**
   * 5. PERMISSIONS & IDENTITY VIEW
   * Derived state that tells the UI:
   * - isSeated: Is the current visitor (User or Guest) at the table?
   * - mySeatIndex: Which specific seat does this visitor own?
   */
  const permissions = useMemo(() => {
    const currentGuestId = typeof window !== 'undefined' ? localStorage.getItem('mahjong_guest_id') : null;
    
    const mySeat = sessionPlayers.find(p => {
      // Priority 1: Match by authenticated Profile ID
      if (user?.id && p.profile_id === user.id) return true;
      // Priority 2: Match by local Guest ID (but only if seat isn't claimed by a profile)
      if (currentGuestId && p.guest_session_id === currentGuestId && !p.profile_id) return true;
      return false;
    });

    return {
      isAdmin: profile?.is_admin || false,
      isSeated: !!mySeat,
      mySeatIndex: mySeat?.seat_index ?? null,
      canRecord: status === 'active'
    };
  }, [sessionPlayers, user, profile, status]);

  /**
   * 6. SCORING & GAMEPLAY UTILS
   */
  const recordHand = async (payload: any) => {
    if (status !== 'active') return;
    const { error } = await supabase.rpc('record_hand_v1', {
      p_session_id: sessionId,
      p_winner_idx: payload.winnerIdx ?? null,
      p_loser_idx: payload.loserIdx !== null ? payload.loserIdx.toString() : null,
      p_base_points: payload.points ?? 0,
      p_is_adjustment: payload.isAdjustment ?? false,
    });
    if (error) console.error("🔍 [Engine Error]:", error.message);
  };

  const getWindForSeat = (seatIdx: number) => {
    const windOffset = (seatIdx - currentDealerIdx + 4) % 4;
    const windData = [{label:'East',zh:'東'},{label:'South',zh:'南'},{label:'West',zh:'西'},{label:'North',zh:'北'}];
    return { ...windData[windOffset], isDealer: windOffset === 0 };
  };

  /**
   * 7. REALTIME SUBSCRIPTIONS
   * Listens to the database and triggers refreshes automatically when 
   * any other player makes a move.
   */
  useEffect(() => {
    refreshScores(); refreshSessionState(); refreshPlayers();
    
    const channel = supabase.channel(`table_sync:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_scores', filter: `session_id=eq.${sessionId}` }, () => refreshScores())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, () => refreshSessionState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` }, () => refreshPlayers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refreshScores, refreshSessionState, refreshPlayers]);

  return {
    status, scores, sessionPlayers, currentDealerIdx, dealerStreak, tableData,
    permissions, guestId, setGuestId, claimSeat, recordHand,
    closeTable: async () => { await supabase.rpc('seal_session', { p_session_id: sessionId }); },
    getWindForSeat, profile
  };
}