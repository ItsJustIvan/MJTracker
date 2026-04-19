'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import JoinTableModal from '@/components/features/lobby/JoinTableModal';
import CreateTableButton from '@/components/features/lobby/CreateTableButton';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // 1. REDIRECT LOGIC: If logged in, send to Dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // 2. While checking auth, show a clean loading state or nothing to avoid "flicker"
  if (authLoading) return <div className="min-h-screen bg-white" />;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      {/* ... Your high-energy Landing UI (The MJ.TRACKER code you have) ... */}
      <div className="w-full max-w-sm space-y-12 text-center">
         <header className="space-y-4">
           <h1 className="text-6xl font-black tracking-tighter text-zinc-900 leading-none">
             MJ<span className="text-emerald-600">.</span>TRACKER
           </h1>
         </header>
         
         <section className="space-y-4">
           <CreateTableButton userId={user?.id} authLoading={authLoading} />
           <button 
             onClick={() => setIsJoinModalOpen(true)}
             className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold py-5 px-8 rounded-3xl border-2 border-zinc-200 transition-all active:scale-95 text-lg uppercase tracking-tight"
           >
             JOIN AS GUEST
           </button>
         </section>
      </div>

      <JoinTableModal 
        isOpen={isJoinModalOpen} 
        onCancel={() => setIsJoinModalOpen(false)} 
        onConfirm={(uuid) => router.push(`/table/${uuid}`)} 
      />
    </main>
  );
}