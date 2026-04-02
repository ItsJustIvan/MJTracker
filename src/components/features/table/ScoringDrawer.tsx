'use client'
import React, { useState, useEffect } from 'react';

interface ScoringDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  playerNames: string[];
  winnerIdx: number | null;
  // 🗝️ Updated Callback: Now uses the resultType pattern
  onRecord: (payload: { 
    resultType: 'win' | 'dead_hand', 
    points: number, 
    loserIdx: number | 'all' | null 
  }) => void;
  // 🗝️ New Prop: Pass the helper from useMahjongTable
  getWindForSeat: (idx: number) => { label: string, isDealer: boolean };
}

export default function ScoringDrawer({ 
  isOpen, 
  onOpen,
  onClose, 
  playerNames, 
  winnerIdx, 
  onRecord,
  getWindForSeat
}: ScoringDrawerProps) {
  
  const [points, setPoints] = useState(3);
  const [selectedLoser, setSelectedLoser] = useState<number | 'all' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedLoser(null);
      setPoints(3);
    }
  }, [isOpen]);

  const handleConfirmWin = () => {
    if (winnerIdx === null || selectedLoser === null) return;
    onRecord({
      resultType: 'win',
      points,
      loserIdx: selectedLoser
    });
    onClose();
  };

  const handleDeadHand = () => {
    onRecord({
      resultType: 'dead_hand',
      points: 0,
      loserIdx: null
    });
    onClose();
  };

  const winnerName = winnerIdx !== null ? playerNames[winnerIdx] : "Select Winner";
  // 🗝️ Dynamically get the wind from the engine
  const winnerWind = winnerIdx !== null ? getWindForSeat(winnerIdx) : null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity duration-500 z-[100] 
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div 
        className={`fixed inset-x-0 bottom-0 z-[110] bg-white rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-zinc-100 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform
          ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'}`}
      >
        
        <button onClick={isOpen ? onClose : onOpen} className="w-full flex flex-col items-center pt-4 pb-6 group">
          <div className="w-12 h-1.5 bg-zinc-200 rounded-full group-hover:bg-zinc-300 mb-3" />
          {!isOpen && (
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                {winnerIdx !== null ? `Result for ${winnerName}` : "Tap a player to record win"}
              </span>
              {winnerIdx !== null && <span className="text-emerald-500 animate-pulse">●</span>}
            </div>
          )}
        </button>

        <div className={`max-w-md mx-auto px-8 pb-12 space-y-8 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          
          <div className="flex justify-between items-center border-b border-zinc-50 pb-6">
            <div className="space-y-1">
              {winnerWind && (
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                  <span className="text-sm leading-none">{winnerWind.label}</span>
                  <span>{winnerWind.isDealer ? 'DEALER' : 'WIND'} WIN</span>
                </div>
              )}
              <h2 className="text-4xl font-black text-zinc-900 uppercase italic leading-none truncate max-w-[240px] tracking-tighter">
                {winnerName}
              </h2>
            </div>
            <div className="text-5xl grayscale opacity-10 select-none">🀄</div>
          </div>

          {/* 1. POINTS SELECTOR */}
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setPoints(Math.max(1, points - 1))} className="h-20 rounded-[2rem] bg-zinc-50 border border-zinc-100 text-3xl font-black active:scale-95 transition-all text-zinc-400 hover:text-zinc-900">−</button>
            <div className="flex flex-col items-center justify-center border-2 border-emerald-100 rounded-[2rem] bg-emerald-50/30">
              <span className="text-4xl font-black tabular-nums text-emerald-900 tracking-tighter">{points}</span>
              <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Points</span>
            </div>
            <button onClick={() => setPoints(points + 1)} className="h-20 rounded-[2rem] bg-zinc-50 border border-zinc-100 text-3xl font-black active:scale-95 transition-all text-zinc-400 hover:text-zinc-900">+</button>
          </div>

          {/* 2. LOSER SELECTION */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Payment Source</p>
            <div className="grid grid-cols-2 gap-3">
              {playerNames.map((name, i) => (
                <button 
                  key={i}
                  disabled={i === winnerIdx}
                  onClick={() => setSelectedLoser(i)}
                  className={`relative py-5 rounded-2xl font-black text-[10px] uppercase border-2 transition-all active:scale-95
                    ${i === winnerIdx ? 'bg-zinc-50 border-transparent text-zinc-200 cursor-not-allowed opacity-30' : selectedLoser === i ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl -translate-y-1' : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300'}`}
                >
                  {name}
                </button>
              ))}
              <button 
                onClick={() => setSelectedLoser('all')}
                className={`col-span-2 py-5 rounded-2xl font-black text-xs uppercase border-2 transition-all active:scale-95
                  ${selectedLoser === 'all' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl -translate-y-1' : 'bg-emerald-50/50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/60'}`}
              >
                🀄 Self-Picked (Zimo)
              </button>
            </div>
          </div>

          {/* 3. ACTIONS */}
          <div className="space-y-3">
            <button 
              disabled={selectedLoser === null || winnerIdx === null}
              onClick={handleConfirmWin}
              className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black text-xl uppercase shadow-2xl disabled:opacity-20 transition-all active:scale-[0.98] hover:bg-black"
            >
              Log Win Result
            </button>
            
            {/* 🗝️ NEW: DEAD HAND BUTTON */}
            <button 
              onClick={handleDeadHand}
              className="w-full py-4 bg-white border-2 border-zinc-100 text-zinc-400 rounded-[1.5rem] font-black text-xs uppercase transition-all active:scale-[0.98] hover:border-zinc-300 hover:text-zinc-600"
            >
              Exhaustive Draw (Dead Hand)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}