'use client'
import { use } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { TableProvider } from '@/context/TableContext'; // 👈 The new logic hub
import GameTableView from '@/components/features/GameTableView';

export default function MahjongTablePage({ params }: { params: Promise<{ sessionId: string }> }) {
  // 1. Unwrap params for Next.js 15
  const { sessionId } = use(params);

  // 2. Get Global Auth (The "Passport")
  const { user, profile, loading: authLoading } = useAuthSession();

  // 3. Guard against missing ID
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-zinc-900 italic">Invalid Session</h1>
          <p className="text-zinc-500 font-medium">This table doesn't exist.</p>
        </div>
      </div>
    );
  }

  // 4. Provide the Table Context to all children
  return (
    <TableProvider 
      sessionId={sessionId} 
      user={user} 
      profile={profile}
    >
      <div className="min-h-screen bg-white selection:bg-emerald-100">
        {/* Notice we no longer pass 'game={game}'! 
           GameTableView will now pull data internally using useTable()
        */}
        <GameTableView /> 
      </div>
    </TableProvider>
  );
}