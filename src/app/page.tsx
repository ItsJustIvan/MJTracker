'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import JoinTableModal from '@/components/features/lobby/JoinTableModal'; // 🗝️ SWAPPED IMPORT
import CreateTableButton from '@/components/features/lobby/CreateTableButton';

export default function LobbyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="w-full max-w-sm space-y-12 text-center">
        
        {/* --- HEADER --- */}
        <header className="space-y-4">
          <div className="inline-block px-4 py-1 rounded-full bg-zinc-100 border border-zinc-200 mb-2">
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Mission Mahjong • v0.3
             </span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-zinc-900 leading-none">
            MJ<span className="text-emerald-600">.</span>TRACKER
          </h1>
        </header>

        {/* --- ACTION BUTTONS --- */}
        <section className="space-y-4">
          <CreateTableButton userId={user?.id} authLoading={authLoading} />

          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold py-5 px-8 rounded-3xl border-2 border-zinc-200 transition-all active:scale-95 text-lg uppercase tracking-tight"
          >
            JOIN EXISTING TABLE
          </button>
        </section>

        {/* --- FOOTER / AUTH STATUS --- */}
        <footer className="pt-8">
          {/* ... existing footer code ... */}
        </footer>
      </div>

      {/* 🗝️ THE NEW MODAL */}
      <JoinTableModal 
        isOpen={isJoinModalOpen} 
        onCancel={() => setIsJoinModalOpen(false)} 
        onConfirm={(uuid) => {
          // No more trimming needed, the modal handles the DB lookup
          router.push(`/table/${uuid}`);
        }}
      />
    </main>
  );
}