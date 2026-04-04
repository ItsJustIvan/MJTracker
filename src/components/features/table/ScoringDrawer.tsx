'use client'
import React, { useState, useEffect } from 'react';

interface ScoringDrawerProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  canAuthFixMode: boolean;
  playerNames: string[];
  winnerIdx: number | null;
  // 🗝️ Updated Payload: Includes isAdjustment flag
  onRecord: (payload: { 
    resultType: 'win' | 'dead_hand' | 'adjustment', 
    points: number, 
    loserIdx: number | 'all' | null,
    isAdjustment?: boolean 
  }) => void;
  getWindForSeat: (idx: number) => { label: string, isDealer: boolean };
}

export default function ScoringDrawer({ 
  isOpen, 
  onOpen,
  onClose,
  canAuthFixMode,
  playerNames, 
  winnerIdx, 
  onRecord,
  getWindForSeat
}: ScoringDrawerProps) {
  
  const [points, setPoints] = useState(3);
  const [selectedLoser, setSelectedLoser] = useState<number | 'all' | null>(null);
  const [isAdjustment, setIsAdjustment] = useState(false);

  // ⌨️ Emergency Exit: Escape Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedLoser(null);
      setPoints(3);
      setIsAdjustment(false);
    }
  }, [isOpen]);

  const handleConfirmWin = () => {
    if (winnerIdx === null || selectedLoser === null) return;
    onRecord({
      resultType: isAdjustment ? 'adjustment' : 'win',
      points,
      loserIdx: selectedLoser,
      isAdjustment
    });
    onClose();
  };

  const handleDeadHand = () => {
    onRecord({
      resultType: 'dead_hand',
      points: 0,
      winnerIdx: null,
      loserIdx: null
    });
    onClose();
  };

  const winnerName = winnerIdx !== null ? playerNames[winnerIdx] : "Select Winner";
  const winnerWind = winnerIdx !== null ? getWindForSeat(winnerIdx) : null;

  return (
    <>
      {/* 1. Backdrop (Click to close) */}
      <div 
        className={`fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity duration-500 z-[100] 
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div 
        className={`fixed inset-x-0 bottom-0 z-[110] bg-white rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-zinc-100 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform
          ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'}`}
      >
        
        {/* 2. Header / Minimize Trigger */}
        <button 
          onClick={isOpen ? onClose : onOpen} 
          className="w-full flex flex-col items-center pt-4 pb-2 group cursor-pointer"
        >
          <div className="w-12 h-1.5 bg-zinc-200 rounded-full group-hover:bg-zinc-300 mb-3" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-600 transition-colors">
              {isOpen ? "Tap to minimize ▽" : (winnerIdx !== null ? `Result for ${winnerName}` : "Tap player to score")}
            </span>
          </div>
        </button>

        <div className={`max-w-md mx-auto px-8 pb-12 space-y-6 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          
          <div className="flex justify-between items-end border-b border-zinc-50 pb-4">
            <div className="space-y-1">
              {winnerWind && (
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit ${isAdjustment ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <span className="text-sm leading-none">{winnerWind.label}</span>
                  <span>{isAdjustment ? 'SCORE ADJUSTMENT' : (winnerWind.isDealer ? 'DEALER WIN' : 'WIND WIN')}</span>
                </div>
              )}
              <h2 className="text-4xl font-black text-zinc-900 uppercase italic leading-none truncate max-w-[240px] tracking-tighter">
                {winnerName}
              </h2>
            </div>
            
            {/* 🛠️ Zero-Sum Adjustment Toggle */}
            {canAuthFixMode && (
              <button 
                onClick={() => setIsAdjustment(!isAdjustment)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${isAdjustment ? 'border-amber-200 bg-amber-50' : 'border-zinc-100 opacity-40 grayscale'}`}
              >
                <span className="text-[8px] font-black uppercase tracking-tighter">Fix Mode</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isAdjustment ? 'bg-amber-500' : 'bg-zinc-200'}`}>
                  <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${isAdjustment ? 'left-5' : 'left-1'}`} />
                </div>
              </button>
            )}
          </div>

          {/* 3. POINTS SELECTOR */}
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setPoints(Math.max(1, points - 1))} className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 text-2xl font-black transition-all active:scale-95 text-zinc-400 hover:text-zinc-900">−</button>
            <div className={`flex flex-col items-center justify-center border-2 rounded-2xl transition-colors ${isAdjustment ? 'border-amber-100 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/30'}`}>
              <span className={`text-3xl font-black tabular-nums tracking-tighter ${isAdjustment ? 'text-amber-900' : 'text-emerald-900'}`}>{points}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isAdjustment ? 'text-amber-600' : 'text-emerald-600'}`}>Points</span>
            </div>
            <button onClick={() => setPoints(points + 1)} className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 text-2xl font-black transition-all active:scale-95 text-zinc-400 hover:text-zinc-900">+</button>
          </div>

          {/* 4. LOSER SELECTION */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">
              {isAdjustment ? "Deduct Points From" : "Payment Source"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {playerNames.map((name, i) => (
                <button 
                  key={i}
                  disabled={i === winnerIdx}
                  onClick={() => setSelectedLoser(i)}
                  className={`relative py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all active:scale-95
                    ${i === winnerIdx ? 'bg-zinc-50 border-transparent text-zinc-200 cursor-not-allowed opacity-30' : selectedLoser === i ? (isAdjustment ? 'bg-amber-600 border-amber-600 text-white' : 'bg-zinc-900 border-zinc-900 text-white') : 'bg-white border-zinc-100 text-zinc-500'}`}
                >
                  {name}
                </button>
              ))}
              {!isAdjustment && (
                <button 
                  onClick={() => setSelectedLoser('all')}
                  className={`col-span-2 py-4 rounded-xl font-black text-xs uppercase border-2 transition-all active:scale-95
                    ${selectedLoser === 'all' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-emerald-50/50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/60'}`}
                >
                  🀄 Self-Picked (Zimo)
                </button>
              )}
            </div>
          </div>

          {/* 5. ACTIONS */}
          <div className="space-y-3">
            <button 
              disabled={selectedLoser === null || winnerIdx === null}
              onClick={handleConfirmWin}
              className={`w-full py-5 rounded-2xl font-black text-lg uppercase shadow-xl disabled:opacity-20 transition-all active:scale-[0.98] ${isAdjustment ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-zinc-900 text-white hover:bg-black'}`}
            >
              {isAdjustment ? 'Apply Correction' : 'Log Win Result'}
            </button>
            
            {!isAdjustment && (
              <button 
                onClick={handleDeadHand}
                className="w-full py-3 bg-white border-2 border-zinc-100 text-zinc-400 rounded-xl font-black text-[10px] uppercase transition-all active:scale-[0.98] hover:text-zinc-600"
              >
                Exhaustive Draw (Dead Hand)
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}