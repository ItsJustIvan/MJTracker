'use client'
import React, { useState } from 'react';

// 1. THIS DEFINES THE "RULES"
interface TransactionPanelProps {
  playerNames: string[];
  winnerIdx: number | null;
  onRecord: (points: number, loserIdx: number | 'all') => void;
  onCancel: () => void;
}

// 2. THIS TELLS THE FUNCTION TO OBEY THE RULES
export default function TransactionPanel({ 
  playerNames, 
  winnerIdx, 
  onRecord, 
  onCancel 
}: TransactionPanelProps) { // <--- ADDED THIS TYPE DEFINITION
  
  const [points, setPoints] = useState(3);
  const [selectedLoser, setSelectedLoser] = useState<number | 'all' | null>(null);

  if (winnerIdx === null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border-4 border-zinc-100 dark:border-zinc-800 p-6">
        
        {/* Header: Who Won? */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recording Win For</span>
            <span className="text-2xl font-black uppercase text-emerald-500">{playerNames[winnerIdx]}</span>
          </div>
          <button 
            onClick={onCancel} 
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold hover:bg-rose-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 1. Point Stepper */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button 
            onClick={() => setPoints(Math.max(1, points - 1))} 
            className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-3xl font-black active:scale-95 transition-transform"
          >
            -
          </button>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
            <span className="text-4xl font-mono font-black tabular-nums">{points}</span>
            <span className="text-[8px] font-black uppercase">Points</span>
          </div>
          <button 
            onClick={() => setPoints(points + 1)} 
            className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-3xl font-black active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        {/* 2. Discarder Selection */}
        <div className="space-y-2 mb-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Who Discarded?</label>
          <div className="grid grid-cols-2 gap-2">
            {playerNames.map((name, i) => (
              i !== winnerIdx && (
                <button 
                  key={i}
                  onClick={() => setSelectedLoser(i)}
                  className={`py-3 rounded-xl font-black text-xs uppercase border-2 transition-all 
                    ${selectedLoser === i 
                      ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-transparent border-zinc-100 dark:border-zinc-800 dark:text-zinc-400'}`}
                >
                  {name}
                </button>
              )
            ))}
            <button 
              onClick={() => setSelectedLoser('all')}
              className={`col-span-2 py-3 rounded-xl font-black text-xs uppercase border-2 border-dashed transition-all
                ${selectedLoser === 'all' 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}
            >
              Self-Picked (All Pay)
            </button>
          </div>
        </div>

        {/* 3. Submit Button */}
        <button 
          disabled={selectedLoser === null}
          onClick={() => onRecord(points, selectedLoser!)}
          className="w-full py-5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-3xl font-black text-xl uppercase shadow-xl disabled:opacity-20 active:scale-[0.98] transition-all"
        >
          Confirm Transaction
        </button>
      </div>
    </div>
  );
}