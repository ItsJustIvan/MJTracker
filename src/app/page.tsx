'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TransactionPanel from '@/components/TransactionPanel';
import AuthModal from '@/components/AuthModal';
import SessionHeader from '@/components/SessionHeader';
import SeatGrid from '@/components/SeatGrid';
import { User } from '@supabase/supabase-js';

export default function MahjongTracker() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0);
  const [dealerStreak, setDealerStreak] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  const sessionId = '64058d9e-2ff2-4db1-9943-a28f421aae1a';

  // ... [Keep refreshScores, refreshSessionState, refreshPlayers from previous version] ...
  // ... [Keep useEffect for auth and realtime subscriptions] ...
  // ... [Keep handleClaimSeat, handleRecordScore, getWindForSeat, getPlayerName] ...

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col">
      <SessionHeader user={user} dealerStreak={dealerStreak} />

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

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}