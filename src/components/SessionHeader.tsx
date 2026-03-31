interface Props {
  dealerStreak: number;
  user: any; // Or User | null
  onOpenSettings: () => void; // Must match what you passed in page.tsx
}

export default function SessionHeader({ dealerStreak, user, onOpenSettings }: Props) {
  return (
    <header className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
      <div className="flex flex-col">
        <h1 className="font-black text-xl tracking-tighter uppercase dark:text-white">Mission Mahjong!</h1>
        {/* ... streak logic ... */}
      </div>
      
      {user ? (
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-2 pl-4 rounded-full border dark:border-zinc-700 hover:border-emerald-500 transition-all"
        >
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-400 uppercase leading-none">Player</p>
            <p className="text-xs font-bold dark:text-zinc-200">Settings</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-sm">
            {user.email?.[0].toUpperCase()}
          </div>
        </button>
      ) : (
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Not Signed In</div>
      )}
    </header>
  );
}