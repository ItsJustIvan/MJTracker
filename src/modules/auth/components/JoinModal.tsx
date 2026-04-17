'use client'
import React, { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';

interface JoinModalProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  onCancel: () => void;
  onConfirm: (guestName: string) => void;
  onSignup: () => void;
}

export default function JoinModal({ isOpen, isLoggedIn, onCancel, onConfirm, onSignup }: JoinModalProps) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return; 
    
    onConfirm(trimmedName);
    setName(""); 
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleConfirm();
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onCancel} 
      title="Claim Your Seat"
    >
      <div className="space-y-6">
        {/* RECOMMENDED PATH */}
        {!isLoggedIn && (
          <button 
            onClick={onSignup}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-2xl font-bold flex items-center justify-between group transition-all active:scale-95 shadow-md shadow-emerald-600/10"
          >
            <div className="text-left">
              <span className="block text-[10px] opacity-80 uppercase font-black tracking-widest">Recommended</span>
              <span className="text-lg">Sign In / Sign Up</span>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          </button>
        )}

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-100"></div>
          <span className="flex-shrink mx-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest">Or play as guest</span>
          <div className="flex-grow border-t border-zinc-100"></div>
        </div>

        {/* GUEST PATH */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Nickname</label>
            <input 
              autoFocus
              className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-zinc-200 focus:border-emerald-500 text-zinc-900 outline-none font-bold placeholder:text-zinc-400 transition-all"
              placeholder="Ex: Guest"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <button 
            disabled={!name.trim()}
            onClick={handleConfirm}
            className="w-full bg-zinc-900 disabled:opacity-20 text-white p-5 rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95 hover:bg-zinc-800"
          >
            Join Table
          </button>
        </div>
        
        <button 
          onClick={onCancel}
          className="w-full text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-zinc-600 transition-colors py-2"
        >
          Cancel
        </button>
      </div>
    </BaseModal>
  );
}