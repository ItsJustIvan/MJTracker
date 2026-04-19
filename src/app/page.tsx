'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import JoinTableModal from '@/components/features/lobby/TableDiscoveryModal';
import CreateTableButton from '@/components/features/lobby/CreateTableButton';
import AuthModal from '@/modules/auth/components/AuthModal';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading) return <div className="min-h-screen bg-white" />;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white p-6 relative">
      
      {/* 1. TOP RIGHT LOGIN (For Returning Users) */}
      <div className="absolute top-8 right-8">
        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          Login / Register
        </button>
      </div>

      <div className="w-full max-w-sm space-y-12 text-center">
        <header className="space-y-4">
          <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
            Beta v1.0
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-zinc-900 leading-none">
            MJ<span className="text-emerald-600">.</span>TRACKER
          </h1>
          <p className="text-zinc-400 font-medium text-sm">Digital scoring for real-world tiles.</p>
        </header>
        
        <section className="space-y-3">
          {/* PRIMARY ACTION */}
          <CreateTableButton userId={user?.id} authLoading={authLoading} />
          
          {/* SECONDARY ACTION */}
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold py-5 px-8 rounded-3xl border-2 border-zinc-100 transition-all active:scale-95 text-lg uppercase tracking-tight"
          >
            Join Table
          </button>
        </section>

        <footer className="pt-8">
           <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">
             No account required for guests.<br/>Sign in to track win rates.
           </p>
        </footer>
      </div>

      {/* MODALS */}
      <JoinTableModal 
        isOpen={isJoinModalOpen} 
        onCancel={() => setIsJoinModalOpen(false)} 
        onConfirm={(uuid) => router.push(`/table/${uuid}`)} 
      />

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => router.push('/dashboard')}
      />
    </main>
  );
}