'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentName: string;
  sessionId: string;
  isAdmin: boolean;
  onUpdate: () => void;
  onCloseTable: () => Promise<void>;
  onOpenAuth: () => void; // 🗝️ Trigger to open your existing AuthModal
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  user, 
  currentName, 
  sessionId, 
  isAdmin, 
  onUpdate,
  onCloseTable,
  onOpenAuth
}: SettingsModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName })
      .eq('id', user.id);

    if (!error) {
      onUpdate();
      onClose();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border dark:border-zinc-800">
        <h2 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tighter">Table Settings</h2>
        
        <div className="space-y-6">
          {user ? (
            /* --- LOGGED IN STATE --- */
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Display Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-grow bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <button 
                    onClick={handleSave}
                    className="px-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t dark:border-zinc-800">
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 text-rose-500 font-bold uppercase text-xs rounded-xl hover:bg-rose-100 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            /* --- LOGGED OUT / GUEST STATE --- */
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-4 text-center leading-relaxed">
                Log in to save your lifetime stats and customize your profile.
              </p>
              <button 
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Sign In / Register
              </button>
            </div>
          )}

          {/* --- ADMIN ACTIONS (ALWAYS VISIBLE IF ADMIN) --- */}
          {isAdmin && (
            <div className="pt-4 border-t dark:border-zinc-800">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 mb-2 block">Admin Tools</label>
              <button 
                onClick={onCloseTable}
                className="w-full py-4 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black uppercase hover:bg-emerald-50 transition-colors"
              >
                Finish Game
              </button>
            </div>
          )}

          <button 
            onClick={onClose}
            className="w-full py-2 text-zinc-400 font-bold uppercase text-[10px] tracking-widest"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}