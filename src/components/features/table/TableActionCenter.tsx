'use client'
import React, { useState } from 'react';
import { useTable } from '@/context/TableContext';
import { supabase } from '@/lib/supabaseClient';

interface TableActionCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TableActionCenter({ isOpen, onClose }: TableActionCenterProps) {
  const { 
    user, profile, permissions, tableData, history, 
    revertLastHand, closeTable, sessionPlayers, isMySeat 
  } = useTable();

  const [view, setView] = useState<'menu' | 'history'>('menu');
  const [isUndoing, setIsUndoing] = useState(false);

  // Find the user's specific player record at this table
  const myPlayerRecord = sessionPlayers?.find((p: any) => isMySeat(p));

  const handleUndo = async () => {
    if (!window.confirm("Undo the last round?")) return;
    setIsUndoing(true);
    await revertLastHand();
    setIsUndoing(false);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* The Unified Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-[110] shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* HEADER: Dynamic based on view */}
          <div className="p-8 pb-4 flex justify-between items-center">
            {view === 'menu' ? (
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter">TABLE MENU</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {tableData?.vanity_name || 'Active Session'}
                </p>
              </div>
            ) : (
              <button onClick={() => setView('menu')} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
                ← Back to Menu
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full text-zinc-400">✕</button>
          </div>

          <div className="flex-grow overflow-y-auto px-8 py-4">
            {view === 'menu' ? (
              <div className="space-y-8">
                {/* 1. Identity Section (Cleaned Up) */}
                <section className="p-5 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Your Identity</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white font-black text-xs">
                      {(profile?.display_name || myPlayerRecord?.guest_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-900 leading-none">
                        {profile?.display_name || myPlayerRecord?.guest_name || 'Spectator'}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">
                        {myPlayerRecord ? `Seat ${myPlayerRecord.seat_index + 1}` : 'Not Seated'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2. The Action Grid */}
                <nav className="grid grid-cols-2 gap-3">
                  <ActionButton 
                    label="Game Log" 
                    icon="📋" 
                    onClick={() => setView('history')} 
                    badge={history?.length}
                  />
                  <ActionButton 
                    label="Share Table" 
                    icon="🔗" 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied!");
                    }} 
                  />
                </nav>

                {/* 3. Navigation Tools */}
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-tight hover:bg-emerald-600 transition-all"
                >
                  Exit to Lobby
                </button>

                {/* 4. Admin Danger Zone */}
                {permissions.isAdmin && (
                  <section className="pt-6 border-t border-zinc-100 space-y-3">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Admin Actions</p>
                    <button 
                      onClick={handleUndo}
                      disabled={isUndoing}
                      className="w-full py-3 border-2 border-zinc-100 rounded-xl font-bold text-xs uppercase hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {isUndoing ? 'Undoing...' : 'Undo Last Hand'}
                    </button>
                    <button 
                      onClick={() => { if(confirm("Archive this table?")) closeTable(); }}
                      className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs uppercase hover:bg-rose-600 hover:text-white transition-all"
                    >
                      Terminate Session
                    </button>
                  </section>
                )}
              </div>
            ) : (
              /* THE HISTORY VIEW (Logic moved from HistoryDrawer) */
              <div className="space-y-4">
                <h3 className="text-xl font-black italic mb-6">GAME LOG</h3>
                {history?.map((round: any, idx: number) => (
                  <div key={idx} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Round {history.length - idx}</p>
                      <p className="text-sm font-bold text-zinc-900">{round.winner_name || 'Draw'}</p>
                    </div>
                    <p className="text-lg font-black italic">+{round.points}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Helper Sub-component for the Grid
function ActionButton({ label, icon, onClick, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-white transition-all group"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-tight text-zinc-500">{label}</span>
        {badge > 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded-full font-bold">{badge}</span>}
      </div>
    </button>
  );
}