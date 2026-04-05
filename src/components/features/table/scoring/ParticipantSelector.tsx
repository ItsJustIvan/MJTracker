// ParticipantSelector.tsx
import React from 'react';

interface Props {
  playerNames: (string | null)[]; // Allow nulls if a seat is empty
  winnerIdx: number | null;
  selectedLoser: number | 'all' | null;
  onSelect: (val: number | 'all') => void;
  isAdjustment: boolean;
  getWindForSeat: (idx: number) => { label: string; isDealer: boolean };
}

export const ParticipantSelector = ({ 
  playerNames, 
  winnerIdx, 
  selectedLoser, 
  onSelect, 
  isAdjustment,
  getWindForSeat
}: Props) => {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">
        {isAdjustment ? "Deduct Points From" : "Payment Source"}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {/* We use 4 as a fallback length if playerNames isn't loaded yet */}
        {(playerNames.length > 0 ? playerNames : [null, null, null, null]).map((name, i) => {
          // Safety check: ensure getWindForSeat is a function before calling
          const wind = getWindForSeat ? getWindForSeat(i) : { label: 'Seat', isDealer: false };
          
          // Force a string fallback to prevent React rendering errors
          const displayName = name || wind.label || `Seat ${i + 1}`;

          return (
            <button 
              key={`seat-${i}`}
              type="button" // Prevent accidental form submissions
              disabled={i === winnerIdx}
              onClick={() => onSelect(i)}
              className={`relative py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all active:scale-95
                ${i === winnerIdx 
                  ? 'bg-zinc-50 border-transparent text-zinc-200 cursor-not-allowed opacity-30' 
                  : selectedLoser === i 
                    ? (isAdjustment ? 'bg-amber-600 border-amber-600 text-white' : 'bg-zinc-900 border-zinc-900 text-white') 
                    : 'bg-white border-zinc-100 text-zinc-500'}`}
            >
              <span className="opacity-30 mr-1.5">{wind.label?.charAt(0) || ''}</span>
              {displayName}
            </button>
          );
        })}

        {!isAdjustment && (
          <button 
            type="button"
            onClick={() => onSelect('all')}
            className={`col-span-2 py-4 rounded-xl font-black text-xs uppercase border-2 transition-all active:scale-95
              ${selectedLoser === 'all' 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                : 'bg-emerald-50/50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/60'}`}
          >
            🀄 Self Picked
          </button>
        )}
      </div>
    </div>
  );
};