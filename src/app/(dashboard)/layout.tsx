// src/app/(dashboard)/layout.tsx
'use client'
import React from 'react';
import Link from 'next/link';
import { useAuthSession } from '@/hooks/useAuthSession';
import UserMenu from '@/components/shared/UserMenu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthSession();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* GLOBAL HEADER */}
      <nav className="h-20 border-b bg-white/80 backdrop-blur-md px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="text-2xl font-black tracking-tighter uppercase">
            MJ<span className="text-emerald-600">.</span>Tracker
          </Link>
          
          {/*<div className="hidden md:flex items-center gap-8 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
            <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Lobby</Link>
            <Link href="/leagues" className="hover:text-emerald-600 transition-colors">Leagues</Link>
            <Link href="/history" className="hover:text-emerald-600 transition-colors">History</Link>
          </div>*/}
        </div>

        {/* IDENTITY ZONE */}
        {!loading && (
          <UserMenu user={user} profile={profile} />
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}