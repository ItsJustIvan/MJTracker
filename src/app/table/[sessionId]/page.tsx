'use client'
import { use } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useMahjongTable } from '@/hooks/useMahjongTable';
import GameTableView from '@/components/features/GameTableView';

export default function MahjongTablePage({ params }: { params: Promise<{ sessionId: string }> }) {
  // 1. Unwrap the params promise for Next.js 15+ compatibility
  const { sessionId } = use(params);

  // 2. Get User Identity and Profile
  const { user, profile, isAdmin, loading: authLoading } = useAuthSession();

  // 3. Connect to the Real-time Mahjong Engine
  const game = useMahjongTable(sessionId, user, profile);

  // 4. Basic Error Handling for the route
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-zinc-900 italic">Invalid Session</h1>
          <p className="text-zinc-500 font-medium">This table doesn't exist or has been closed.</p>
        </div>
      </div>
    );
  }

  // 5. Render the View Layer with the v0.2 aesthetic wrapper
  return (
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      <GameTableView 
        sessionId={sessionId}
        game={game}
        user={user}
        isAdmin={isAdmin}
      />
    </div>
  );
}