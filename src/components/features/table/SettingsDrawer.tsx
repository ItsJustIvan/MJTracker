'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  matchingSeat: any; 
  isAdmin: boolean;
  onUpdate: (newName: string) => void;
  onCloseTable: () => Promise<void>;
  onOpenAuth: () => void;
}

export default function SettingsDrawer({ 
  isOpen, onClose, user, profile, matchingSeat, isAdmin, onUpdate, onCloseTable, onOpenAuth 
}: SettingsDrawerProps) {
  const [newName, setNewName] = useState('');
  
  // If matchingSeat exists, they are physically at the table.
  const isSeated = !!matchingSeat;

  /**
   * 1. Identity Sync
   * Syncs the input field whenever the drawer opens or the user changes.
   */
  useEffect(() => {
    const currentName = matchingSeat?.guest_name || profile?.display_name || '';
    setNewName(currentName);
  }, [profile, matchingSeat, isOpen]);

  /**
   * 2. Name Persistence Logic
   * Updates global profile if logged in, otherwise updates session-specific guest name.
   */
  const handleSaveName = async () => {
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', user.id);
      if (!error) onUpdate(newName);
    } else if (isSeated) {
      onUpdate(newName);
    }
    onClose();
  };

  /**
   * 3. Sign Out (The "Persistent Stake" Method)
   * Destroys the session. Does NOT call vacate. 
   * Reloading forces the app to re-evaluate identity as a Guest.
   */
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.reload();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-sm:w-full max-w-sm bg-white z-[110] shadow-2xl transform transition-transform duration-300 ease-in-out ${
    isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter leading-none">SETTINGS</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                {isSeated 
                  ? `Occupying Seat ${(matchingSeat.index ?? matchingSeat.seat_index ?? 0) + 1}` 
                  : 'Spectator Mode'}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors">
              ✕
            </button>
          </div>

          <div className="flex-grow space-y-10">
            {/* Identity Section */}
            <section className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block ml-1">
                Display Name
              </label>
              
              {isSeated || user ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Who are you?"
                      className="flex-grow bg-zinc-50 border border-zinc-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <button 
                      onClick={handleSaveName}
                      className="px-6 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-transform"
                    >
                      SAVE
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic ml-1">
                    {user ? "Changes your global profile name." : "Changes your name for this game session."}
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-xs font-bold text-zinc-400 italic leading-relaxed text-center">
                    You aren't seated yet.<br/>Claim a seat to customize your name.
                  </p>
                </div>
              )}
            </section>

            {/* Account CTA for Guests */}
            {!user && (
              <section className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-black text-emerald-900 mb-4 uppercase tracking-tight">Save your progress</p>
                  <p className="text-[11px] text-emerald-700 mb-5 leading-snug font-medium">
                    Create an account to track your win rate across multiple sessions.
                  </p>
                  <button 
                    onClick={onOpenAuth}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-transform"
                  >
                    Register Now
                  </button>
                </div>
              </section>
            )}

            {/* Admin Controls */}
            {isAdmin && (
              <section className="pt-10 border-t border-zinc-100">
                <label className="text-[10px] font-black uppercase text-rose-400 tracking-widest block mb-4 ml-1">Table Management</label>
                <button 
                  onClick={() => {
                    if(confirm("End this session for everyone?")) onCloseTable();
                  }}
                  className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-xs border border-rose-100 hover:bg-rose-600 hover:text-white transition-all active:scale-[0.98]"
                >
                  Terminate Session
                </button>
              </section>
            )}
          </div>

          {/* Footer / Auth Status */}
          {user && (
            <div className="mt-auto pt-6 border-t border-zinc-100 space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                  {profile?.display_name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-black text-zinc-900 truncate uppercase tracking-tight">
                    {profile?.display_name || 'Authenticated Player'}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full py-4 bg-zinc-50 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl font-black uppercase text-[10px] tracking-widest text-center transition-all active:scale-[0.98]"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}