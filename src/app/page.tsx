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
  // Static ID for now, as per your setup
  const sessionId = '64058d9e-2ff2-4db1-9943-a28f421aae1a';
  
  const { 
    user, 
    sessionPlayers, 
    scores, 
    currentDealerIdx, 
    dealerStreak,
    status, 
    permissions,        // NEW: Pull from hook
    handleClaimSeat, 
    handleRemovePlayer, // NEW: Pull from hook
    handleRecordScore,
    handleCloseTable, 
    refreshPlayers 
  } = useMahjongSession(sessionId);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  // --- MISSING HELPERS ADDED BELOW ---

  // 1. Get Player Name (Updated to handle Guests)
  const getPlayerName = (idx: number) => {
    const player = sessionPlayers.find(p => p.seat_index === idx);
    if (!player) return `Seat ${idx + 1}`;
    return player.profiles?.display_name || player.guest_name || "Guest";
  };

  // 2. Wind Logic (Calculates wind based on dealer position)
  const getWindForSeat = (seatIdx: number) => {
    // 0: East, 1: South, 2: West, 3: North
    return (seatIdx - currentDealerIdx + 4) % 4;
  };

  // 3. Selection Logic
  const handleSelectWinner = (idx: number) => {
    // Only allow selecting a winner if the seat is occupied
    const isOccupied = sessionPlayers.some(p => p.seat_index === idx);
    if (isOccupied && status === 'active') {
      setWinnerIdx(idx === winnerIdx ? null : idx);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col">
      <SessionHeader 
        user={user} 
        dealerStreak={dealerStreak} 
        status={status}
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onCloseTable={handleCloseTable}
      />
      
      <SeatGrid 
        status={status}
        scores={scores}
        sessionPlayers={sessionPlayers}
        currentDealerIdx={currentDealerIdx}
        winnerIdx={winnerIdx}
        getPlayerName={getPlayerName}
        getWindForSeat={getWindForSeat} // Now defined!
        onSelectWinner={handleSelectWinner} // Now defined!
        currentUserId={user?.id}
        permissions={permissions} // Now pulled from hook!
        onRemovePlayer={handleRemovePlayer} // Now pulled from hook!
        onClaim={handleClaimSeat}
      />

      {status === 'active' && winnerIdx !== null && (
        <TransactionPanel 
          playerNames={[0,1,2,3].map(i => getPlayerName(i))}
          winnerIdx={winnerIdx}
          onRecord={(pts, loser) => {
            handleRecordScore(winnerIdx, pts, loser);
            setWinnerIdx(null);
          }}
          onCancel={() => setWinnerIdx(null)}
        />
      )}

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