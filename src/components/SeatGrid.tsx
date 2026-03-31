'use client'
import { useState } from 'react';
import ScoreCard from './ScoreCard';
import JoinModal from './JoinModal';

interface Props {
  status: 'active' | 'closed';
  scores: number[];
  sessionPlayers: any[];
  currentDealerIdx: number;
  winnerIdx: number | null;
  getPlayerName: (idx: number) => string;
  getWindForSeat: (idx: number) => number;
  onClaim: (idx: number, guestName?: string) => void;
  onRemovePlayer: (idx: number) => void;
  onSelectWinner: (idx: number) => void;
  currentUserId: string | undefined;
  permissions: any;
  onOpenAuth: () => void; // Defined in interface
}

export default function SeatGrid({ 
  status,
  scores, 
  sessionPlayers, 
  currentDealerIdx, 
  winnerIdx, 
  getPlayerName, 
  getWindForSeat, 
  onClaim, 
  onRemovePlayer,
  onSelectWinner,
  currentUserId,
  permissions,
  onOpenAuth // <--- ADDED THIS HERE to destructure it
}: Props) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const userIsSittingSomewhereElse = sessionPlayers.some(p => p.profile_id === currentUserId);

  return (
    <main className="grid grid-cols-2 gap-4 p-4 flex-1">
      {scores.map((score, i) => {
        const isOccupied = sessionPlayers.some(p => p.seat_index === i);
        
        return (
          <div key={i} className="relative group">
            <ScoreCard 
              index={i}
              name={getPlayerName(i)}
              score={score}
              windIdx={getWindForSeat(i)}
              isDealer={i === currentDealerIdx}
              isSelected={winnerIdx === i}
              onClick={() => onSelectWinner(i)}
            />

            {/* --- ACTION BUTTONS --- */}
            {status === 'active' && (
              <div className="absolute top-2 right-2 flex gap-1">
                {!isOccupied && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedSeat(i); 
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-[9px] text-white px-2 py-1 rounded font-bold uppercase transition-all shadow-lg active:scale-95"
                  >
                    {userIsSittingSomewhereElse ? 'Move' : 'Claim'}
                  </button>
                )}

                {isOccupied && permissions?.isAdmin && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(confirm("Clear this seat?")) onRemovePlayer(i); 
                    }}
                    className="bg-red-500 hover:bg-red-600 text-[9px] text-white px-2 py-1 rounded font-bold uppercase transition-all shadow-lg"
                  >
                    Leave
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <JoinModal 
        isOpen={selectedSeat !== null}
        isLoggedIn={!!currentUserId}
        onCancel={() => setSelectedSeat(null)}
        onConfirm={(guestName: string) => {
          onClaim(selectedSeat!, guestName);
          setSelectedSeat(null);
        }}
        onSignup={() => {
          setSelectedSeat(null);
          onOpenAuth(); // Now this will work because onOpenAuth is destructured!
        }}
      />
    </main>
  );
}