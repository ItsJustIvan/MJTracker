'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentName: string;
  onUpdate: () => void;
}

export default function SettingsModal({ isOpen, onClose, user, currentName, onUpdate }: SettingsModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName })
      .eq('id', user.id);

    if (error) {
      alert("Error updating profile!");
    } else {
      onUpdate(); // Refresh the main app data
      onClose();
    }
    setLoading(false);
  };

  const handleLeaveSeat = async () => {
  if (!user) return;
  const { error } = await supabase
    .from('session_players')
    .delete()
    .eq('profile_id', user.id);

  if (!error) {
    onUpdate(); // This triggers the refreshPlayers in page.tsx
    onClose();
  }
};

  const handleLogout = async () => {
  setLoading(true);
  
  // 1. "Stand up" from the table before leaving
  if (user) {
    await supabase
      .from('session_players')
      .delete()
      .eq('session_id', '64058d9e-2ff2-4db1-9943-a28f421aae1a') // Use your sessionId variable
      .eq('profile_id', user.id);
  }

  // 2. Clear the Auth session
  await supabase.auth.signOut();
  
  // 3. Force refresh to reset the UI
  window.location.reload();
};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-[2rem] shadow-2xl border dark:border-zinc-800">
        <h2 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tighter">Player Settings</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Display Name</label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Enter your name..."
            />
          </div>
          <button 
  onClick={handleLeaveSeat}
  className="w-full py-3 mb-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl text-xs uppercase"
>
  Leave Current Seat
</button>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <div className="pt-4 border-t dark:border-zinc-800">
            <button 
              onClick={handleLogout}
              className="w-full py-3 text-rose-500 font-bold uppercase text-xs hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              Log Out
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}