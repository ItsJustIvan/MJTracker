'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useSessionScores(sessionId: string) {
  // We initialize with a safe array of 4 zeros to prevent UI "jumping"
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  /**
   * REFRESH SCORES
   * Pulls the 4 rows from session_scores and maps them to the correct seat index.
   */
  const refreshScores = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('session_scores')
      .select('seat_index, total_score')
      .eq('session_id', sessionId)
      .order('seat_index', { ascending: true });

    if (error) {
      console.error("🚫 [useSessionScores] Fetch Error:", error.message);
    } else if (data) {
      // Map the rows into a flat array: [Seat 0 Score, Seat 1 Score, ...]
      const newScores = [0, 0, 0, 0];
      data.forEach(row => {
        newScores[row.seat_index] = row.total_score;
      });
      setScores(newScores);
    }
    setLoading(false);
  }, [sessionId]);

  /**
   * SUBSCRIPTION
   * Listens for any UPDATE to the session_scores table.
   * This is what makes the score "pop" on the screen the moment a win is recorded.
   */
  useEffect(() => {
    refreshScores();

    const channel = supabase.channel(`table_scores:${sessionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'session_scores', 
        filter: `session_id=eq.${sessionId}` 
      }, () => refreshScores())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refreshScores]);

  return {
    scores,
    loading,
    refreshScores
  };
}