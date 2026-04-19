'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useUserSessions } from '@/hooks/useUserSessions';
import JoinTableModal from '@/components/features/lobby/TableDiscoveryModal';
import CreateTableButton from '@/components/features/lobby/CreateTableButton';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuthSession();
  const { activeSessions, loading: sessionsLoading } = useUserSessions(user?.id);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-50/50 p-6">
      <div className="max-w-md mx-auto pt-12 space-y-8">
        
        {/* --- WELCOME HEADER --- */}
        <header className="space-y-1">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
            Player Dashboard
          </p>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">
            Welcome back, <br/>
            <span className="text-zinc-500">{profile?.display_name || user?.email?.split('@')[0] || 'Player'}</span>
          </h1>
        </header>
        {/* 🗝️ RESUME SESSION SECTION (Now clean and logic-free) */}
        {!sessionsLoading && activeSessions.length > 0 && (
          <section className="space-y-3">
             <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
               Resume Active Game
             </h3>
             {activeSessions.map(session => (
               <button 
                 key={session.id}
                 onClick={() => router.push(`/table/${session.id}`)}
                 className="w-full bg-white p-6 rounded-[2rem] border-2 border-emerald-100 flex justify-between items-center group active:scale-[0.98] transition-all"
               >
                 <div>
                   <p className="text-xl font-black text-zinc-900">{session.short_code}</p>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Table UUID: {session.id.slice(0,8)}...</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                   →
                 </div>
               </button>
             ))}
          </section>
        )}

        {/* --- STATS PLACEHOLDER BENTO --- */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Lifetime Wins</p>
            <p className="text-2xl font-black text-zinc-300 italic">--</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Rank</p>
            <p className="text-2xl font-black text-zinc-300 italic">--</p>
          </div>
          <div className="col-span-2 bg-zinc-900 p-6 rounded-[2rem] relative overflow-hidden group">
             <div className="relative z-10">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">League Progress</p>
                <p className="text-sm font-bold text-white opacity-50">Career stats & history coming soon.</p>
             </div>
             {/* Decorative element */}
             <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 group-hover:rotate-12 transition-transform">🀄</div>
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