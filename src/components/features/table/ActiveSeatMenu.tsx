'use client'
import React from 'react';
import BaseModal from '@/components/shared/ui/BaseModal';

interface ActiveSeatMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
  onSignup: () => void;
  name: string;
  isGuest: boolean;
}

export default function ActiveSeatMenu({ 
  isOpen, 
  onClose, 
  onLeave, 
  onSignup, 
  name, 
  isGuest 
}: ActiveSeatMenuProps) {
  
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isGuest ? 'Guest Settings' : 'Seat Settings'}
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
           <div>
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Current User</p>
             <h3 className="text-xl font-bold text-zinc-900">{name}</h3>
           </div>
           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
             isGuest ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
           }`}>
             {isGuest ? 'Guest' : 'Verified'}
           </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isGuest && (
            <button 
              onClick={onSignup}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md shadow-emerald-600/10"
            >
              <span className="text-xl">✨</span> 
              <span>Save My Lifetime Stats</span>
            </button>
          )}

          <button 
            onClick={onLeave}
            className="w-full bg-white hover:bg-red-50 text-red-600 p-5 rounded-2xl font-bold border-2 border-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Leave Seat
          </button>
        </div>
        
        <p className="text-[10px] text-zinc-400 text-center font-medium leading-relaxed px-4">
          {isGuest 
            ? "Guest points are session-only. Upgrade to a permanent profile to track your rank." 
            : "Leaving your seat allows another player to take your place."}
        </p>
      </div>
    </BaseModal>
  );
}