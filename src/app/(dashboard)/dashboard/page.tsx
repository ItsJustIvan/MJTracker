'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useUserSessions } from '@/hooks/useUserSessions';
import { useUserStats } from '@/hooks/useUserStats'; // Import our new hook
import JoinTableModal from '@/components/features/lobby/TableDiscoveryModal';
import CreateTableButton from '@/components/features/lobby/CreateTableButton';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuthSession();
  const { activeSessions, loading: sessionsLoading } = useUserSessions(user?.id);
  
  // Use our new hook
  const { stats, selectedSeason, setSelectedSeason, availableSeasons } = useUserStats(user?.id);
  
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-50/50 p-6">
      <div className="max-w-md mx-auto pt-12 space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Dashboard</p>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">
              Hello, <span className="text-zinc-500">{profile?.display_name || 'Player'}</span>
            </h1>
          </div>
          
          {/* SEASON SELECTOR DROPDOWN */}
          <select 
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="mt-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="lifetime">Lifetime</option>
            {availableSeasons.map(month => (
              <option key={month} value={month}>
                {new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              </option>
            ))}
          </select>
        </header>

        {/* --- TROPHY BENTO GRID --- */}
        <section className="grid grid-cols-2 gap-3">
          {/* Tile 1: Highest Hand */}
          <div className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Highest Hand</p>
            <p className="text-3xl font-black text-zinc-900 tracking-tighter">
              {stats?.maxHand || 0}<span className="text-xs text-zinc-300 ml-1">pts</span>
            </p>
            <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.03] group-hover:scale-110 transition-transform">🀄</div>
          </div>

          {/* Tile 2: Biggest Payout */}
          <div className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Max Payout</p>
            <p className="text-3xl font-black text-emerald-600 tracking-tighter">
              +{stats?.maxPayout || 0}
            </p>
            <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.03] group-hover:scale-110 transition-transform">💰</div>
          </div>

          {/* Tile 3: Total Points (Wide) */}
          <div className="col-span-2 bg-zinc-900 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
             <div className="relative z-10 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Accumulated Points</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {(stats?.totalPoints || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Games</p>
                  <p className="text-xl font-black text-white leading-none">{stats?.gamesPlayed || 0}</p>
                </div>
             </div>
             {/* Subtle Glow Effect */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full" />
          </div>

          {/* Tile 4: Max Streak (Optional/New) */}
          <div className="col-span-2 bg-white p-4 rounded-2xl border border-dashed border-zinc-200 flex justify-between items-center px-6">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Best Dealer Streak</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-900">{stats?.maxStreak || 0} Wins</span>
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            </div>
          </div>
        </section>

        {/* --- PRIMARY ACTIONS --- */}
        <section className="space-y-3 pt-4">
          <div className="space-y-1 pb-2">
             <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Start Playing</h3>
          </div>
          
          <CreateTableButton userId={user?.id} authLoading={authLoading} />

          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold py-5 px-8 rounded-3xl border-2 border-zinc-200 transition-all active:scale-95 text-lg uppercase tracking-tight shadow-sm"
          >
            Join Existing Table
          </button>
        </section>

        {/* --- TIPS / NEWS --- */}
        <footer className="pt-8 text-center">
           <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
              <p className="text-[11px] font-bold text-emerald-800 leading-relaxed">
                Tip: Use the "Log Win" button during a game to automatically track dealer streaks and points.
              </p>
           </div>
        </footer>
      </div>

      <JoinTableModal 
        isOpen={isJoinModalOpen} 
        onCancel={() => setIsJoinModalOpen(false)} 
        onConfirm={(uuid) => router.push(`/table/${uuid}`)}
      />
    </main>
  );
}