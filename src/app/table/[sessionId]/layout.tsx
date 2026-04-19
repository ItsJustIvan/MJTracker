'use client'
import { use } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { TableProvider } from '@/context/TableContext';

export default function TableLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { user, profile } = useAuthSession();

  return (
    <TableProvider 
      sessionId={sessionId} 
      user={user} 
      profile={profile}
    >
      {children}
    </TableProvider>
  );
}