'use client'
import React from 'react';

interface ManageSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
  onSignup: () => void;
  name: string;
  isGuest: boolean;
}

export default function ManageSeatModal({ 
  isOpen, 
  onClose, 
  onLeave, 
  onSignup, 
  name, 
  isGuest 
}: ManageSeatModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[120] p-4">
      {/* Container: White, rounded, high-contrast */}
      <div className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold leading-tight text-zinc-900">{name}</h3>
            <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${isGuest ? 'bg-orange-400' : 'bg-emerald-500 animate-pulse'}`} />
               <span className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-400">
                 {isGuest ? 'Guest Player' : 'Verified Profile'}
               </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-zinc-100 rounded-full text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* --- ACTIONS --- */}
        <div className="space-y-4">
          {/* PROMOTIONAL ACTION: Turn Guest into Member */}
          {isGuest && (
            <button 
              onClick={onSignup}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md shadow-emerald-600/10"
            >
              <span className="text-xl">✨</span> 
              <span>Save My Lifetime Stats</span>
            </button>
          )}

          {/* DANGER ACTION: Leave the table */}
          <button 
            onClick={onLeave}
            className="w-full bg-white hover:bg-red-50 text-red-600 p-5 rounded-2xl font-bold border-2 border-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🚪</span>
            Leave Seat
          </button>
        </div>
        
        {/* --- CONTEXTUAL HELP --- */}
        <div className="mt-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <p className="text-[11px] text-zinc-500 text-center font-medium leading-relaxed">
            {isGuest 
              ? "Your points are only saved for this session. Join as a member to track your career wins." 
              : "Vacating this seat allows another player to take your spot at the table."}
          </p>
        </div>
      </div>
    </div>
  );
}