'use client'
import React, { useState } from 'react';
import { useMahjongSession } from '@/hooks/useMahjongSession';

// COMPONENT IMPORTS
import SessionHeader from '@/components/SessionHeader';
import SeatGrid from '@/components/SeatGrid';
import TransactionPanel from '@/components/TransactionPanel';
import SettingsModal from '@/components/SettingsModal';
import AuthModal from '@/components/AuthModal';
import ManageSeatModal from '@/components/ManageSeatModal'; // NEW COMPONENT

export default function MahjongTracker() {
  const sessionId = '64058d9e-2ff2-4db1-9943-a28f421aae1a';
  
  const { 
    user, 
    sessionPlayers, 
    scores, 
    currentDealerIdx, 
    dealerStreak,
    status, 
    permissions,
    guestSeat,          // NEW: From updated hook
    handleClaimSeat, 
    handleLeaveSeat,    // NEW: From updated hook
    handleRemovePlayer,
    handleRecordScore,
    handleCloseTable, 
    refreshPlayers 
  } = useMahjongSession(sessionId);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false); // NEW
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [managedSeatIdx, setManagedSeatIdx] = useState<number | null>(null); // NEW

  // 1. Get Player Name
  const getPlayerName = (idx: number) => {
    const player = sessionPlayers.find(p => p.seat_index === idx);
    if (!player) return `Seat ${idx + 1}`;
    return player.profiles?.display_name || player.guest_name || "Guest";
  };

  // 2. Wind Logic
  const getWindForSeat = (seatIdx: number) => {
    return (seatIdx - currentDealerIdx + 4) % 4;
  };

  // 3. UPDATED: Selection & Management Logic
  const handleSeatInteraction = (idx: number) => {
    if (status !== 'active') return;

    const player = sessionPlayers.find(p => p.seat_index === idx);
    if (!player) return; // Can't select an empty seat as a winner

    // Determine if this is "My Seat" (Account or Local Guest)
    const isMySeat = (user && player.profile_id === user.id) || (guestSeat === idx);

    if (isMySeat) {
      // Open Management menu for self
      setManagedSeatIdx(idx);
      setIsManageModalOpen(true);
    } else {
      // Select someone else as the winner
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
        getWindForSeat={getWindForSeat}
        onSelectWinner={handleSeatInteraction} // POINTING TO NEW LOGIC
        currentUserId={user?.id}
        permissions={permissions}
        onRemovePlayer={handleRemovePlayer}
        onClaim={handleClaimSeat}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* NEW: Manage Seat Modal */}
      <ManageSeatModal 
        isOpen={isManageModalOpen}
        name={managedSeatIdx !== null ? getPlayerName(managedSeatIdx) : ''}
        isGuest={!user}
        onClose={() => setIsManageModalOpen(false)}
        onLeave={() => {
          if (managedSeatIdx !== null) handleLeaveSeat(managedSeatIdx);
          setIsManageModalOpen(false);
        }}
        onSignup={() => {
          setIsManageModalOpen(false);
          setIsAuthModalOpen(true);
        }}
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