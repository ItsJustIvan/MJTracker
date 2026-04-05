// src/components/features/table/SeatAction.tsx
import React from 'react';

interface SeatActionProps {
  isGhost: boolean;
  isMySeat: boolean;
  isUserAlreadySeated: boolean;
  isTableClosed: boolean; // 🗝️ New Prop
  onClaim: () => void;
  onLeave: () => void;
}

export default function SeatAction({ 
  isGhost, 
  isMySeat, 
  isUserAlreadySeated, 
  isTableClosed, // 🗝️ Destructure here
  onClaim, 
  onLeave 
}: SeatActionProps) {

  // 🔒 GUARD: If the session is over, show a read-only badge
  if (isTableClosed) {
    return (
      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100/80 px-4 py-1.5 rounded-full border border-zinc-200/50">
        Session Ended
      </span>
    );
  }
  
  // STATE A: Seat is Empty (Ghost)
  if (isGhost) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onClaim(); }}
        className={`text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 px-4 py-1.5 rounded-full ${
          isUserAlreadySeated 
            ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white' 
            : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'
        }`}
      >
        {isUserAlreadySeated ? (
          <><span className="text-xs">⇄</span> Move Here</>
        ) : (
          <><span className="text-xs">+</span> Claim Seat</>
        )}
      </button>
    );
  }

  // STATE B: This is the Current User's Seat
  if (isMySeat) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onLeave(); }}
        className="text-[9px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-4 py-1.5 rounded-full hover:bg-rose-600 hover:text-white transition-all"
      >
        Leave Seat
      </button>
    );
  }

  // STATE C: Someone else is sitting here
  return (
    <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Select to record win
    </span>
  );
}