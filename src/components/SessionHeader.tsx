'use client'
import { User } from '@supabase/supabase-js';

interface Props {
  dealerStreak: number;
  user: User | null;
}

export default function SessionHeader({ dealerStreak, user }: Props) {
  return (
    <header className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
      <div className="flex flex-col">
        <h1 className="font-black text-xl tracking-tighter uppercase dark:text-white">Mission Mahjong!</h1>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
          {dealerStreak > 0 && (
            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              STREAK: {dealerStreak}
            </span>
          )}
        </div>
      </div>
      {user && (
        <div className="text-right">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Logged In</p>
          <p className="text-xs font-medium dark:text-zinc-300">{user.email}</p>
        </div>
      )}
    </header>
  );
}