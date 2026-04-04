'use client'
import React, { useState } from 'react';
import { useTable } from '@/context/TableContext'; // 👈 The new single source of truth
import SeatCard from './table/SeatCard';
import ScoringDrawer from './table/ScoringDrawer';
import SettingsDrawer from './table/SettingsDrawer'; 
import AuthModal from '@/components/features/auth/AuthModal';
import JoinModal from '@/components/features/lobby/JoinModal';

export default function GameTableView() {
  // 1. Hook into the Table Context
  // We grab everything we need directly from the provider.
  const { 
    sessionId,
    scores, 
    sessionPlayers, 
    dealerStreak,
    tableData, 
    guestId,
    recordHand, 
    claimSeat, 
    closeTable, 
    getWindForSeat,
    profile,
    history,
    permissions, // isAdmin, isSeated, mySeatIndex, etc.
    user         // Passed through from the Provider
  } = useTable();

  // 2. UI-only State
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [pendingSeatIndex, setPendingSeatIndex] = useState<number | null>(null);

  // 3. Stabilize Seats (Ghost Logic)
  const stabilizedSeats = [0, 1, 2, 3].map(idx => {
    const player = sessionPlayers?.find((p: any) => p.seat_index === idx);
    const isGhost = !player || (!player.profile_id && !player.guest_name && !player.guest_session_id);
    
    // We use the helper from our Identity hook logic (via permissions)
    const isMySeat = permissions.mySeatIndex === idx;
    
    return {
      index: idx,
      player: isGhost ? null : player,
      score: scores[idx] || 0,
      name: isGhost ? `Empty Seat` : (player?.profiles?.display_name || player?.guest_name || "Guest"),
      isGhost,
      isMySeat
    };
  });

  const mySeat = stabilizedSeats.find(s => s.isMySeat);
  const playerNames = stabilizedSeats.map(s => s.name);

  // 4. Action Handlers
  const handleOpenScoring = (idx: number) => {
    setWinnerIdx(idx);
    setIsDrawerOpen(true);
  };

  const handleInitiateClaim = (idx: number) => {
    setPendingSeatIndex(idx);
    if (user) {
      claimSeat({ seatIndex: idx, userId: user.id, guestId });
      return;
    }
    const hasLocalName = typeof window !== 'undefined' ? localStorage.getItem('mahjong_guest_name') : null;
    if (guestId && hasLocalName) {
      claimSeat({ seatIndex: idx, guestId, guestName: hasLocalName }); 
      return;
    }
    setIsJoinModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col overflow-hidden">
      {/* HEADER: Sync with TableData */}
      <header className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase">
            MJ<span className="text-emerald-600">.</span>Tracker
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {tableData?.vanity_name || 'Join Code'}:
            </p>
            <button 
              onClick={() => tableData?.short_code && navigator.clipboard.writeText(tableData.short_code)}
              className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"
            >
              {tableData?.short_code?.toUpperCase() || "------"}
            </button>
          </div>
        </div>
        
        <button onClick={() => setIsSettingsModalOpen(true)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100">
          ☰
        </button>
      </header>

      {/* MAIN GRID */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-zinc-50/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4 h-full max-h-[600px]">
          {stabilizedSeats.map((seat) => {
            const windInfo = getWindForSeat(seat.index); 
            return (
              <SeatCard 
                key={seat.index}
                {...seat} // Spreading stabilized seat data
                displayName={seat.name}
                wind={windInfo.label}
                windZh={windInfo.zh}
                isDealer={windInfo.isDealer}
                dealerStreak={dealerStreak}
                onSelect={() => handleOpenScoring(seat.index)}
                onClaim={() => handleInitiateClaim(seat.index)}
                isUserAlreadySeated={permissions.isSeated}
                onLeave={() => claimSeat({ seatIndex: seat.index, guestId, isVacating: true })}
              />
            );
          })}
        </div>
      </main>

      {/* MODALS & DRAWERS */}
      <ScoringDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        playerNames={playerNames}
        winnerIdx={winnerIdx}
        onRecord={(payload) => {
          recordHand({ ...payload, winnerIdx });
          setIsDrawerOpen(false);
        }}
        getWindForSeat={getWindForSeat}
        canAuthFixMode={permissions.isAdmin || (user && tableData?.created_by === user.id)} 
      />

      <JoinModal 
        isOpen={isJoinModalOpen}
        isLoggedIn={!!user}
        onCancel={() => setIsJoinModalOpen(false)}
        onConfirm={(name) => {
          claimSeat({ seatIndex: pendingSeatIndex!, guestId, guestName: name }); 
          setIsJoinModalOpen(false);
        }}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          claimSeat({ seatIndex: pendingSeatIndex!, userId: user?.id, guestId }); 
          setIsAuthModalOpen(false);
        }}
      />

      <SettingsDrawer 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        profile={profile}
        matchingSeat={mySeat}
        isAdmin={permissions.isAdmin}
        history={history}
        onCloseTable={closeTable}
      />
    </div>
  );
}