// @/hooks/useScoringActions.ts
import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useScoringActions(
  sessionId: string, 
  currentDealerIdx: number, 
  dealerStreak: number,
  refreshGameState: () => Promise<void>
) {
  
  const recordHand = useCallback(async (payload: {
    winnerIdx: number | null;
    loserIdx: number | 'all' | null;
    points: number;
    resultType: 'win' | 'dead_hand' | 'adjustment';
    isDealerPointsOn: boolean;
  }) => {
    
    // 1. Construct the 8-parameter RPC payload
    const rpcPayload = {
      p_session_id: sessionId,
      p_winner_idx: payload.winnerIdx,
      p_loser_idx: payload.loserIdx?.toString() || null, // Convert 'all' or number to string
      p_points: payload.points || 0,
      p_result_type: payload.resultType,
      // SNAPSHOTS: These ensure history remains accurate even after rotation
      p_dealer_at_time: currentDealerIdx, 
      p_streak_at_time: dealerStreak,
      p_dealer_points_on: payload.isDealerPointsOn
    };

    console.log("🎲 [ScoringAction] Sending Payload:", rpcPayload);

    const { error } = await supabase.rpc('record_hand', rpcPayload);

    if (error) {
      console.error("🚫 [ScoringAction] RPC Error:", error.message);
      throw error;
    }

    // 2. Refresh the session state (rotation, hand number, etc.)
    // Note: Scores and History refresh automatically via their own subscriptions
    await refreshGameState();

  }, [sessionId, currentDealerIdx, dealerStreak, refreshGameState]);

  return { recordHand };
}