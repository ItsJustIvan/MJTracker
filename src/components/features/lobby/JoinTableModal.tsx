'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface JoinTableModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (uuid: string) => void;
}

export default function JoinTableModal({ isOpen, onCancel, onConfirm }: JoinTableModalProps) {
  const [code, setCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleLookup = async () => {
    setIsSearching(true);
    const cleanCode = code.trim().toUpperCase();

    // 🗝️ THE SHORT CODE LOOKUP
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('short_code', cleanCode)
      .single();

    if (data?.id) {
      onConfirm(data.id); // Returns the actual UUID for the router
    } else {
      alert("Table not found. Double check the code!");
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-zinc-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Enter Table Code</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ask the host for their 6-digit code</p>
        </div>

        <input 
          autoFocus
          maxLength={7}
          className="w-full p-6 text-center text-3xl font-black rounded-2xl bg-zinc-50 border-2 border-zinc-200 focus:border-emerald-500 uppercase tracking-widest outline-none transition-all"
          placeholder="XJ92KP"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <div className="space-y-3">
          <button 
            disabled={code.length < 4 || isSearching}
            onClick={handleLookup}
            className="w-full bg-emerald-600 disabled:opacity-20 text-white p-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            {isSearching ? 'FINDING...' : 'ENTER TABLE'}
          </button>
          
          <button onClick={onCancel} className="w-full text-zinc-400 text-[10px] font-black uppercase tracking-widest py-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}