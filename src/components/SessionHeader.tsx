'use client'
import React from 'react';
import { User } from '@supabase/supabase-js';

interface Props {
  user: User | null;
  dealerStreak: number;
  status: 'active' | 'closed';
  onOpenSettings: () => void;
  onCloseTable: () => void;
}

export default function SessionHeader({ 
  user, 
  dealerStreak, 
  status, 
  onOpenSettings, 
  onCloseTable 
}: Props) {
  
  const handleCloseConfirm = () => {
    if (window.confirm("Are you sure you want to close this table? This will lock the scores and increment 'Games Played' for everyone.")) {
      onCloseTable();
    }
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800">
      <div className="flex flex-col">
        <h1 className="text-xl font-black tracking-tighter dark:text-white uppercase">
          Table Tracker
        </h1>
        <div className="flex gap-2 items-center">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'
          }`}>
            {status}
          </span>
          {status === 'active' && dealerStreak > 0 && (
            <span className="text-[10px] font-bold text-orange-500 uppercase">
              Streak: {dealerStreak}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {status === 'active' && (
          <button 
            onClick={handleCloseConfirm}
            className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl uppercase transition-all shadow-md active:scale-95"
          >
            Finish Game
          </button>
        )}
        
        <button 
          onClick={onOpenSettings}
          className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl hover:opacity-80 transition-all"
        >
          {/* Settings Icon or Emoji */}
          ⚙️
        </button>
      </div>
    </header>
  );
}