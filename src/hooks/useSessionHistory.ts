'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useSessionHistory(sessionId: string) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * REFRESH HISTORY
   * Pulls from the history view. We order by created_at DESC 
   * so the most recent hand is always at index [0].
   */
  const refreshHistory = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('vw_round_history') // Using the view for formatted names/data
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("🚫 [useSessionHistory] Fetch Error:", error.message);
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  }, [sessionId]);

  /**
   * ACTION: REVERT LAST HAND (UNDO)
   * This calls the specialized RPC to delete the last transaction 
   * and recalculate the scores backward.
   */
  const revertLastHand = async () => {
    if (history.length === 0) return { success: false, message: "No hands to revert." };

    const { error } = await supabase.rpc('revert_last_round', {
      p_session_id: sessionId
    });

    if (error) {
      console.error("🚫 [useSessionHistory] Undo Error:", error.message);
      return { success: false, error };
    }

    // Refreshing history here; other hooks will sync via Realtime
    await refreshHistory();
    return { success: true };
  };

  /**
   * SUBSCRIPTION
   * Listens for any NEW transactions or DELETIONS (undo) in the transactions table.
   */
  useEffect(() => {
    refreshHistory();

    const channel = supabase.channel(`table_history:${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions', 
        filter: `session_id=eq.${sessionId}` 
      }, () => refreshHistory())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refreshHistory]);

  return {
    history,
    loading,
    revertLastHand,
    refreshHistory
  };
}