'use client'
import ScoreCard from './ScoreCard';

interface Props {
  status: 'active' | 'closed';
  scores: number[];
  sessionPlayers: any[];
  currentDealerIdx: number;
  winnerIdx: number | null;
  getPlayerName: (idx: number) => string;
  getWindForSeat: (idx: number) => number;
  onClaim: (idx: number) => void;
  onSelectWinner: (idx: number) => void;
  currentUserId: string | undefined; // Add this to identify "Me"
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
  onSelectWinner,
  currentUserId
}: Props) {
  // Check if "I" am already sitting in any of the 4 seats
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
            {!isOccupied && status === 'active' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClaim(i); }}
                className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-[9px] text-white px-2 py-1 rounded font-bold uppercase transition-all shadow-lg active:scale-95"
              >
                {userIsSittingSomewhereElse ? 'Move Here' : 'Claim'}
              </button>
            )}
          </div>
        );
      })}
    </main>
  );
}