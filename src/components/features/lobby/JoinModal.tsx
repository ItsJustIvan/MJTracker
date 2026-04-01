'use client'
import { useState } from 'react';

interface JoinModalProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  onCancel: () => void;
  onConfirm: (guestName: string) => void;
  onSignup: () => void;
}

export default function JoinModal({ isOpen, isLoggedIn, onCancel, onConfirm, onSignup }: JoinModalProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200">
        
        {/* --- HEADER --- */}
        <div className="p-8 pb-4 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-emerald-100">
            🀄
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Claim Your Seat</h2>
          <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">Choose how you want to play</p>
        </div>

        <div className="p-8 pt-4 space-y-6">
          {/* --- OPTION 1: THE MEMBER PATH --- */}
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

          {/* --- OPTION 2: THE GUEST PATH --- */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Nickname</label>
              <input 
                autoFocus
                className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-zinc-200 focus:border-emerald-500 text-zinc-900 outline-none font-bold placeholder:text-zinc-400 transition-all"
                placeholder="Ex: Guest"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <button 
              disabled={!name.trim()}
              onClick={() => onConfirm(name)}
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
      </div>
    </div>
  );
}