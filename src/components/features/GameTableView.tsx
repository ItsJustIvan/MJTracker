'use client'
import React, { useState } from 'react';
import SeatCard from './table/SeatCard';
import ScoringDrawer from './table/ScoringDrawer';
import SettingsDrawer from './table/SettingsDrawer'; 
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
    guestId,
    setGuestId,
    recordHand, 
    claimSeat, 
    closeTable, 
    getWindForSeat,
    profile
  } = game;

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [pendingSeatIndex, setPendingSeatIndex] = useState<number | null>(null);

// 1. Define the Seats (Ghost Logic)
  const stabilizedSeats = [0, 1, 2, 3].map(idx => {
    const player = sessionPlayers?.find((p: any) => p.seat_index === idx);
    
    // A seat is a ghost if no record exists OR all identity fields are empty
    const isGhost = !player || (!player.profile_id && !player.guest_name && !player.guest_session_id);
    
    // Identify if THIS player is the current user/guest
    const isMySeat = !isGhost && (
      (user && player.profile_id === user.id) || 
      (guestId && player.guest_session_id === guestId)
    );

    return {
      index: idx,
      player: isGhost ? null : player,
      score: scores[idx] || 0,
      name: isGhost ? `Empty Seat` : (player?.profiles?.display_name || player?.guest_name || "Guest"),
      isGhost,
      isMySeat
    };
  });

  // 2. NOW we can find "mySeat" and "playerNames" because the list above is finished
  const mySeat = stabilizedSeats.find(s => s.isMySeat);
  const playerNames = stabilizedSeats.map(s => s.name);

  // 3. Action Handlers
  const handleOpenScoring = (idx: number) => {
    setWinnerIdx(idx);
    setIsDrawerOpen(true);
  };

  const handleInitiateClaim = (idx: number) => {
    setPendingSeatIndex(idx);
    if (user) {
      claimSeat(idx); 
    } else {
      setIsJoinModalOpen(true);
    }
  };

  const handleLeaveSeat = async (idx: number) => {
    if (window.confirm("Are you sure you want to vacate this seat?")) {
      await claimSeat(idx, undefined); 
      
      if (!user) {
        localStorage.removeItem('mahjong_guest_id');
        if (setGuestId) setGuestId(null);
        setIsJoinModalOpen(false);
      }
    }
  };

const handleRecordPayload = (payload: { 
    resultType: 'win' | 'dead_hand' | 'adjustment', 
    points: number, 
    loserIdx: number | 'all' | null,
    isAdjustment?: boolean
  }) => {
    // 🎯 The Goal: Pass raw data to the hook. 
    // The hook will then call: supabase.rpc('record_hand_v1', {...})
    
    recordHand({
      winnerIdx: winnerIdx, // Captured from state when card was clicked
      loserIdx: payload.loserIdx, // 'all' or the specific seat index
      points: payload.points,
      resultType: payload.resultType,
      isAdjustment: !!payload.isAdjustment
    });

    setIsDrawerOpen(false);
    // 🧹 Delay the reset so the drawer animation finishes before the name disappears
    setTimeout(() => setWinnerIdx(null), 500);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
        <div>
          <h1 className="text-xl font-black tracking-tighter">
            MJ<span className="text-emerald-600">.</span>TRACKER
          </h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Table #{sessionId.slice(0, 4).toUpperCase()}
          </p>
        </div>
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-xl text-zinc-400 border border-zinc-100 hover:bg-zinc-100 transition-colors"
        >
          ☰
        </button>
      </header>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-zinc-50/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4 h-full max-h-[600px]">
          {stabilizedSeats.map((seat) => {
            const windInfo = getWindForSeat(seat.index); 
            
            return (
              <SeatCard 
                key={seat.index}
                index={seat.index}
                player={seat.player}
                displayName={seat.name}
                score={seat.score}
                wind={windInfo.label}
                windZh={windInfo.zh}
                isDealer={windInfo.isDealer}
                dealerStreak={dealerStreak}
                isGhost={seat.isGhost}
                isMySeat={seat.isMySeat}
                onSelect={() => handleOpenScoring(seat.index)}
                onClaim={() => handleInitiateClaim(seat.index)}
                isUserAlreadySeated={!!mySeat}
                onLeave={() => handleLeaveSeat(seat.index)}
              />
            );
          })}
        </div>
      </main>

      <ScoringDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        playerNames={playerNames}
        winnerIdx={winnerIdx}
        onRecord={handleRecordPayload}
        getWindForSeat={getWindForSeat}
        canAuthFixMode={isAdmin || (user && game?.tableData?.created_by === user.id)}      />

      <JoinModal 
        isOpen={isJoinModalOpen}
        isLoggedIn={!!user}
        onCancel={() => setIsJoinModalOpen(false)}
        onConfirm={(name) => {
          claimSeat(pendingSeatIndex!, name); 
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
          claimSeat(pendingSeatIndex!); 
          setIsAuthModalOpen(false);
        }}
      />

      <SettingsDrawer 
  isOpen={isSettingsModalOpen}
  onClose={() => setIsSettingsModalOpen(false)}
  user={user}            // Auth User
  profile={profile}      // Profile data from hook
  matchingSeat={mySeat}  // The stabilized seat object (index, player, name, etc.)
  isAdmin={isAdmin}
  onUpdate={(newName: string) => {
    // If we have a seat, update it. If not, this shouldn't even be clickable.
    if (mySeat) {
      claimSeat(mySeat.index, newName);
    }
  }}
  onCloseTable={closeTable}
  onOpenAuth={() => {
    setIsSettingsModalOpen(false);
    setIsAuthModalOpen(true);
  }}
/>
    </div>
  );
}