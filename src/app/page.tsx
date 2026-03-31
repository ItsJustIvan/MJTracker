'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TransactionPanel from '@/components/TransactionPanel';
import AuthModal from '@/components/AuthModal';
import SessionHeader from '@/components/SessionHeader';
import SeatGrid from '@/components/SeatGrid';
import SettingsModal from '@/components/SettingsModal';
import { User } from '@supabase/supabase-js';

export default function MahjongTracker() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0);
  const [dealerStreak, setDealerStreak] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const sessionId = '64058d9e-2ff2-4db1-9943-a28f421aae1a';

  // --- 1. DATA FETCHERS ---
  const refreshScores = useCallback(async () => {
    const { data } = await supabase.from('session_scores').select('player_idx, total_score').eq('session_id', sessionId);
    if (data) {
      const newScores = [0, 0, 0, 0];
      data.forEach(row => { newScores[row.player_idx] = row.total_score; });
      setScores(newScores);
    }
  }, [sessionId]);

  const refreshSessionState = useCallback(async () => {
    const { data } = await supabase.from('sessions').select('current_dealer_idx, dealer_streak').eq('id', sessionId).single();
    if (data) {
      setCurrentDealerIdx(data.current_dealer_idx);
      setDealerStreak(data.dealer_streak);
    }
  }, [sessionId]);

const refreshPlayers = useCallback(async () => {
  const { data } = await supabase
    .from('session_players')
    .select('profile_id, seat_index, profiles(display_name, avatar_url)') // Added profile_id here
    .eq('session_id', sessionId);
  
  if (data) setSessionPlayers(data);
}, [sessionId]);

  // --- 2. AUTH & REALTIME ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setIsAuthModalOpen(false);
    });

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

  // --- 3. MISSING HELPERS (The "ReferenceError" Fix) ---
  const getPlayerName = (seatIdx: number) => {
    const player = sessionPlayers.find(p => p.seat_index === seatIdx);
    return player?.profiles?.display_name || `Seat ${seatIdx + 1}`;
  };

  const getWindForSeat = (seatIdx: number) => (seatIdx - currentDealerIdx + 4) % 4;

  const handleClaimSeat = async (seatIdx: number) => {
    if (!user) return setIsAuthModalOpen(true);
    const { error } = await supabase.from('session_players').insert({ session_id: sessionId, profile_id: user.id, seat_index: seatIdx });
    if (error) alert("Seat taken!");
  };

  const handleRecordScore = async (basePoints: number, loserIdx: number | 'all') => {
    if (winnerIdx === null) return;
    await supabase.from('transactions').insert({
      session_id: sessionId,
      winner_index: winnerIdx,
      loser_target: loserIdx.toString(),
      base_points: basePoints,
      dealer_at_time: currentDealerIdx
    });
    setWinnerIdx(null);
  };

  // --- 4. RENDER ---
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col">
      <SessionHeader 
  user={user} 
  dealerStreak={dealerStreak} 
  onOpenSettings={() => setIsSettingsOpen(true)} // You'll need to add this prop to SessionHeader
/>
      
      <SeatGrid 
        scores={scores}
        sessionPlayers={sessionPlayers}
        currentDealerIdx={currentDealerIdx}
        winnerIdx={winnerIdx}
        getPlayerName={getPlayerName}
        getWindForSeat={getWindForSeat}
        onClaim={handleClaimSeat}
        onSelectWinner={(i) => setWinnerIdx(i === winnerIdx ? null : i)}
      />

      <TransactionPanel 
        playerNames={[0,1,2,3].map(i => getPlayerName(i))}
        winnerIdx={winnerIdx}
        onRecord={handleRecordScore}
        onCancel={() => setWinnerIdx(null)}
      />
      <SettingsModal 
  isOpen={isSettingsOpen} 
  onClose={() => setIsSettingsOpen(false)} 
  user={user}
  currentName={sessionPlayers.find(p => p.profile_id === user?.id)?.profiles?.display_name || ''}
  onUpdate={refreshPlayers}
/>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}