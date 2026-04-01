'use client'
import React, { useState } from 'react';
import SeatCard from './table/SeatCard';
import ScoringDrawer from './table/ScoringDrawer';
import SettingsModal from './table/SettingsModal'; // 🗝️ Ensure this is imported
import AuthModal from '@/components/features/auth/AuthModal';
import JoinModal from '@/components/features/lobby/JoinModal';

interface GameTableViewProps {
  sessionId: string;
  game: any; 
  user: any; 
  isAdmin: boolean;
}

export default function GameTableView({ sessionId, game, user, isAdmin }: GameTableViewProps) {
  const { 
    scores, 
    sessionPlayers, 
    currentDealerIdx, 
    dealerStreak, 
    permissions,
    handleRecordScore,
    handleUndo,
    handleClaimSeat,
    handleCloseTable // 🗝️ Grab this from game hook
  } = game;

  // --- UI STATE ---
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // 🗝️ New State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [pendingSeatIndex, setPendingSeatIndex] = useState<number | null>(null);

  /**
   * 1. STABILIZED DATA MODEL
   */
  const stabilizedSeats = [0, 1, 2, 3].map(idx => {
    const player = sessionPlayers?.find((p: any) => p.seat_index === idx);
    return {
      index: idx,
      player,
      score: scores[idx] || 0,
      name: player?.profiles?.display_name || player?.guest_name || `Player 0${idx + 1}`,
      isGhost: !player
    };
  });

  const playerNames = stabilizedSeats.map(s => s.name);

  const handleOpenScoring = (idx: number) => {
    setWinnerIdx(idx);
    setIsDrawerOpen(true);
  };

  const handleInitiateClaim = (idx: number) => {
    setPendingSeatIndex(idx);
    if (user) {
      handleClaimSeat(idx);
    } else {
      setIsJoinModalOpen(true);
    }
  };

const handleRecordAndClose = (points: number, loserIdx: number | 'all') => {
    // 🗝️ Safety: If for some reason winnerIdx is null, abort to prevent crash
    if (winnerIdx === null) return;

    // 🗝️ Create the data packet for the hook
    // Since ScoringDrawer now sends raw values, this is much cleaner
    const dataPacket = {
      winnerIdx: winnerIdx,
      points: points,
      isSelfDraw: loserIdx === 'all',
      loserIdx: loserIdx === 'all' ? null : (loserIdx as number)
    };

    console.log("🚀 Clean Packet for Hook:", dataPacket);

    // Call the hook with the structured object
    handleRecordScore(dataPacket);

    // Close and reset
    setIsDrawerOpen(false);
    
    // We wait for the drawer animation (300ms) before clearing winnerIdx
    // so the UI doesn't "flicker" or change text while closing
    setTimeout(() => setWinnerIdx(null), 300);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
        <div>
          <h1 className="text-xl font-black tracking-tighter">
            MJ<span className="text-emerald-600">.</span>TRACKER
          </h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Table #{sessionId.slice(0, 4).toUpperCase()}
          </p>
        </div>

        <div className="flex gap-2">
          {permissions.canUndo && (
            <button 
              onClick={handleUndo} 
              className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black uppercase hover:bg-zinc-200 transition-all"
            >
              Undo
            </button>
          )}
          <button 
            onClick={() => setIsSettingsModalOpen(true)} // 🗝️ Trigger
            className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-xl text-zinc-400 border border-zinc-100 hover:bg-zinc-100 transition-colors"
          >
            ☰
          </button>
        </div>
      </header>

      {/* --- MAIN 2x2 GRID --- */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-zinc-50/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4 h-full max-h-[600px]">
          {stabilizedSeats.map((seat) => (
            <SeatCard 
              key={seat.index}
              index={seat.index}
              player={seat.player}
              displayName={seat.name}
              score={seat.score}
              isDealer={currentDealerIdx === seat.index}
              dealerStreak={dealerStreak}
              isGhost={seat.isGhost}
              onSelect={() => handleOpenScoring(seat.index)}
              onClaim={() => handleInitiateClaim(seat.index)}
            />
          ))}
        </div>
      </main>

      {/* --- SCORING DRAWER --- */}
      <ScoringDrawer 
        isOpen={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => setIsDrawerOpen(false)}
        playerNames={playerNames}
        winnerIdx={winnerIdx}
        onRecord={handleRecordAndClose}
      />

      {/* --- MODALS --- */}
      <JoinModal 
        isOpen={isJoinModalOpen}
        isLoggedIn={!!user}
        onCancel={() => setIsJoinModalOpen(false)}
        onConfirm={(name) => {
          handleClaimSeat(pendingSeatIndex!, name);
          setIsJoinModalOpen(false);
        }}
        onSignup={() => {
          setIsJoinModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          handleClaimSeat(pendingSeatIndex!);
          setIsAuthModalOpen(false);
        }}
      />

{/* 🗝️ SETTINGS MODAL */}
<SettingsModal 
  isOpen={isSettingsModalOpen}
  onClose={() => setIsSettingsModalOpen(false)}
  sessionId={sessionId}
  isAdmin={isAdmin}
  user={user} // 👈 Also make sure to pass the user object
  currentName={user?.profiles?.display_name || ""} // 👈 And the current name
  onUpdate={() => window.location.reload()} // 👈 Or your refresh logic
  onCloseTable={handleCloseTable} 
  onOpenAuth={() => setIsAuthModalOpen(true)} // 🗝️ THIS FIXES THE ERROR
/>
    </div>
  );
}