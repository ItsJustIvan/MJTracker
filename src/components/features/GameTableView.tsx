'use client'
import React, { useState } from 'react';
import { useTable } from '@/context/TableContext';
import SeatCard from './table/SeatCard';
import ScoringDrawer from './table/scoring/ScoringDrawer';
// 1. Updated Import Name
import TableActionCenter from './table/TableActionCenter'; 
import AuthModal from '@/modules/auth/components/AuthModal';
import JoinModal from '@/components/features/table/SeatClaimModal';
import { supabase } from '@/lib/supabaseClient';

interface ScoringPayload {
  winnerIdx: number | null;
  loserIdx: number | 'all' | null;
  points: number;
  resultType: 'win' | 'dead_hand' | 'adjustment';
  isDealerPointsOn: boolean;
}

export default function GameTableView() {
  const { 
    scores, 
    sessionPlayers, 
    dealerStreak,
    tableData, 
    guestId,
    recordHand, 
    claimSeat, 
    getWindForSeat,
    permissions, 
    user 
  } = useTable();

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Renamed from isSettingsModalOpen
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [pendingSeatIndex, setPendingSeatIndex] = useState<number | null>(null);

  const stabilizedSeats = [0, 1, 2, 3].map(idx => {
    const player = sessionPlayers?.find((p: any) => p.seat_index === idx);
    const isGhost = !player || (!player.profile_id && !player.guest_name && !player.guest_session_id);
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

  const playerNames = stabilizedSeats.map(s => s.name);

  const handleOpenScoring = (idx: number) => {
    if (permissions.isTableClosed) return;
    setWinnerIdx(idx);
    setIsDrawerOpen(true);
  };

  const handleInitiateClaim = (idx: number) => {
    if (permissions.isTableClosed) return;
    setPendingSeatIndex(idx);

    if (user?.id) {
      claimSeat({ seatIndex: idx, userId: user.id, guestId });
      return;
    }

    if (permissions.isSeated && guestId) {
      const savedName = typeof window !== 'undefined' ? localStorage.getItem('mahjong_guest_name') : 'Guest';
      claimSeat({ seatIndex: idx, guestId, guestName: savedName });
      return;
    }

    setIsJoinModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">
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
        </div>
        
        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full text-zinc-900 font-bold">
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
                {...seat}
                isTableClosed={permissions.isTableClosed}
                displayName={seat.name}
                wind={windInfo.label}
                windZh={windInfo.zh}
                isDealer={windInfo.isDealer}
                dealerStreak={dealerStreak}
                isUserAlreadySeated={permissions.isSeated}
                onSelect={() => handleOpenScoring(seat.index)}
                onClaim={() => handleInitiateClaim(seat.index)}
                onLeave={() => claimSeat({ seatIndex: seat.index, guestId, isVacating: true })}
              />
            );
          })}
        </div>
      </main>

      {/* SCORING */}
      <ScoringDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        playerNames={playerNames}
        winnerIdx={winnerIdx}
        onRecord={(payload: ScoringPayload) => {
          recordHand({ ...payload, winnerIdx });
          setIsDrawerOpen(false);
        }}
        getWindForSeat={getWindForSeat}
        canAuthFixMode={permissions.isAdmin || (user && tableData?.created_by === user.id)} 
      />

      {/* JOIN LOGIC */}
      <JoinModal 
        isOpen={isJoinModalOpen}
        isLoggedIn={!!user}
        onCancel={() => setIsJoinModalOpen(false)}
        onConfirm={(name) => {
          claimSeat({ seatIndex: pendingSeatIndex!, guestId, guestName: name }); 
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
        onSuccess={async () => {
          if (guestId && user?.id) {
            await supabase.rpc('migrate_guest_to_player', {
              p_guest_session_id: guestId,
              p_profile_id: user.id
            });
          }
          if (pendingSeatIndex !== null) {
            claimSeat({ seatIndex: pendingSeatIndex, userId: user?.id, guestId });
          }
          setIsAuthModalOpen(false);
        }}
      />

      {/* 2. REFACTORED SMART DRAWER */}
      <TableActionCenter 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
}