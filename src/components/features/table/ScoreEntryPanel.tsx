'use client'
import React, { useState } from 'react';

interface ScoreEntryPanelProps {
  onRecord: (winner: number, points: number, loser: number | 'all') => void;
  sessionPlayers: any[];
}

export default function ScoreEntryPanel({ onRecord, sessionPlayers }: ScoreEntryPanelProps) {
  const [winner, setWinner] = useState<number | null>(null);
  const [loser, setLoser] = useState<number | 'all' | null>(null);
  const [points, setPoints] = useState(3); // Default to a standard 3-fan win

  const handleSubmit = () => {
    if (winner !== null && loser !== null) {
      onRecord(winner, points, loser);
    }
  };

  const getPlayerName = (idx: number) => {
    const p = sessionPlayers?.find(sp => sp.seat_index === idx);
    return p?.profiles?.display_name || p?.guest_name || `P${idx + 1}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl space-y-8">
      {/* 1. WINNER SELECTION */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          Who Won?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => setWinner(idx)}
              className={`py-4 rounded-2xl font-bold transition-all text-xs ${
                winner === idx 
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {getPlayerName(idx)}
            </button>
          ))}
        </div>
      </div>

      {/* 2. METHOD / LOSER SELECTION */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          How / From Whom?
        </label>
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => setLoser('all')}
            className={`py-3 rounded-xl font-bold text-[10px] transition-all border ${
              loser === 'all' 
                ? 'bg-blue-600 border-blue-400 text-white' 
                : 'bg-slate-800 border-transparent text-slate-400'
            }`}
          >
            SELF-DRAW
          </button>
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              disabled={winner === idx}
              onClick={() => setLoser(idx)}
              className={`py-3 rounded-xl font-bold text-[10px] transition-all border disabled:opacity-10 ${
                loser === idx 
                  ? 'bg-red-600 border-red-400 text-white' 
                  : 'bg-slate-800 border-transparent text-slate-400'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 3. POINTS / FAN */}
      <div className="space-y-3">
        <div className="flex justify-between items-center ml-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Fan / Points
          </label>
          <span className="text-xl font-mono font-black text-emerald-400">{points}</span>
        </div>
        <input 
          type="range" min="1" max="13" step="1"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* 4. SUBMIT */}
      <button
        disabled={winner === null || loser === null}
        onClick={handleSubmit}
        className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-emerald-400 transition-colors disabled:opacity-10 active:scale-95"
      >
        CONFIRM RESULT
      </button>
    </div>
  );
}