'use client' // Ensure this is at the top for Next.js App Router
import { useState } from 'react'; // <--- Add this line

// Inside JoinModal.tsx
export default function JoinModal({ isOpen, isLoggedIn, onCancel, onConfirm, onSignup }: any) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
        
        {/* Header Section */}
        <div className="p-6 pb-0 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🀄
          </div>
          <h2 className="text-2xl font-black tracking-tight">Claim Your Seat</h2>
          <p className="text-sm text-zinc-500 mt-1">Choose how you want to play today.</p>
        </div>

        <div className="p-6 space-y-4">
          {/* OPTION 1: THE PRO PATH (Sign Up) */}
          {!isLoggedIn && (
            <button 
              onClick={onSignup}
              className="w-full bg-zinc-950 dark:bg-white dark:text-zinc-950 text-white p-4 rounded-xl font-bold flex items-center justify-between group transition-all active:scale-95"
            >
              <div className="text-left">
                <span className="block text-xs opacity-70 uppercase font-black">Recommended</span>
                <span className="text-lg">Sign In / Sign Up</span>
              </div>
              <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
          )}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Or play as guest</span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          {/* OPTION 2: THE GUEST PATH */}
          <div className="space-y-2">
            <input 
              autoFocus
              className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              placeholder="Enter Nickname..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button 
              disabled={!name.trim()}
              onClick={() => onConfirm(name)}
              className="w-full bg-emerald-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white p-4 rounded-xl font-bold transition-all active:scale-95"
            >
              Join Table
            </button>
          </div>
          
          {/* Subtle exit if they just want to look at the scores */}
          <button 
            onClick={onCancel}
            className="w-full text-zinc-400 text-xs font-medium hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors py-2"
          >
            Just viewing for now
          </button>
        </div>
      </div>
    </div>
  );
}