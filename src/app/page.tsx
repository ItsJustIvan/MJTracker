'use client'
import React, { useState } from 'react';
import { useMahjongSession } from '@/hooks/useMahjongSession';

// COMPONENT IMPORTS
import SessionHeader from '@/components/SessionHeader';
import SeatGrid from '@/components/SeatGrid';
import TransactionPanel from '@/components/TransactionPanel';
import SettingsModal from '@/components/SettingsModal';
import AuthModal from '@/components/AuthModal';

export default function MahjongTracker() {
  const sessionId = '64058d9e-2ff2-4db1-9943-a28f421aae1a';
  
  const { 
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
  } = useMahjongSession(sessionId);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  // HELPER: UI NAME LOGIC
  const getPlayerName = (idx: number) => 
    sessionPlayers.find(p => p.seat_index === idx)?.profiles?.display_name || `Seat ${idx + 1}`;

  // WRAPPER: CLAIM LOGIC
  const onClaimAttempt = async (idx: number) => {
    const success = await handleClaimSeat(idx);
    if (!success) setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col">
      <SessionHeader 
        user={user} 
        dealerStreak={dealerStreak} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
      />
      
      <SeatGrid 
        scores={scores}
        sessionPlayers={sessionPlayers}
        currentDealerIdx={currentDealerIdx}
        winnerIdx={winnerIdx}
        getPlayerName={getPlayerName}
        getWindForSeat={(idx) => (idx - currentDealerIdx + 4) % 4}
        onClaim={onClaimAttempt}
        onSelectWinner={(i) => {
          if (status === 'active') {
            setWinnerIdx(i === winnerIdx ? null : i);
          }
        }}
        currentUserId={user?.id}
        status={status}
      />

      <TransactionPanel 
        playerNames={[0,1,2,3].map(i => getPlayerName(i))}
        winnerIdx={winnerIdx}
        onRecord={(pts, loser) => {
          if (winnerIdx !== null) handleRecordScore(winnerIdx, pts, loser);
          setWinnerIdx(null);
        }}
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