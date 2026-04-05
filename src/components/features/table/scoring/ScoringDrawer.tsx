'use client'
import React, { useState, useEffect } from 'react';
import { RuleToggles } from './RuleToggles';
import { PointGrid } from './PointGrid';
import { ParticipantSelector } from './ParticipantSelector'; // Assuming you have the code from my previous response

interface ScoringDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  canAuthFixMode: boolean;
  playerNames: string[];
  winnerIdx: number | null;
  onRecord: (payload: any) => void;
  getWindForSeat: (idx: number) => { label: string; isDealer: boolean };
}

export default function ScoringDrawer({ 
  isOpen, onClose, canAuthFixMode, playerNames, winnerIdx, onRecord, getWindForSeat 
}: any) {
  
  const [points, setPoints] = useState(3);
  const [selectedLoser, setSelectedLoser] = useState<number | 'all' | null>(null);
  const [isAdjustment, setIsAdjustment] = useState(false);
  const [isDealerPointsOn, setIsDealerPointsOn] = useState(true);

  // Reset logic
  useEffect(() => {
    if (!isOpen) {
      setSelectedLoser(null);
      setPoints(3);
      setIsAdjustment(false);
      setIsDealerPointsOn(true);
    }
  }, [isOpen]);

  const handleDeadHand = () => {
    onRecord({
      resultType: 'dead_hand',
      points: 0,
      loserIdx: null,
      isDealerPointsOn: true // Dead hands usually follow dealer rules (streak increases)
    });
    onClose();
  };

  const handleConfirmWin = () => {
    if (winnerIdx === null || selectedLoser === null) return;
    onRecord({
      resultType: isAdjustment ? 'adjustment' : 'win',
      points,
      loserIdx: selectedLoser,
      isDealerPointsOn
    });
    onClose();
  };

  const winnerName = winnerIdx !== null ? playerNames[winnerIdx] : "Select Winner";
  const winnerWind = winnerIdx !== null ? getWindForSeat(winnerIdx) : null;

  return (
    <>
      <div className={`fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity z-[100] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      
      <div className={`fixed inset-x-0 bottom-0 z-[110] bg-white rounded-t-[3rem] transition-transform duration-500 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Header Handle */}
        <div className="w-full flex flex-col items-center pt-4 pb-2"><div className="w-12 h-1.5 bg-zinc-200 rounded-full"  onClick={onClose}/></div>

        <div className="max-w-md mx-auto px-8 pb-12 space-y-6">
          <div className="flex justify-between items-end border-b border-zinc-50 pb-4">
             <h2 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter truncate">{winnerName}</h2>
          </div>

          {/* 1. The Point Selector */}
          <PointGrid points={points} setPoints={setPoints} isAdjustment={isAdjustment} />

          {/* 2. The Participant Grid */}
          <ParticipantSelector 
            playerNames={playerNames} 
            winnerIdx={winnerIdx} 
            selectedLoser={selectedLoser} 
            onSelect={setSelectedLoser} 
            isAdjustment={isAdjustment} 
            getWindForSeat={getWindForSeat}
          />

          {/* 3. The Rules Toggles */}
          <RuleToggles 
            canAuthFixMode={canAuthFixMode}
            isAdjustment={isAdjustment}
            setIsAdjustment={setIsAdjustment}
            isDealerPointsOn={isDealerPointsOn}
            setIsDealerPointsOn={setIsDealerPointsOn}
          />

          {/* 4. Action Button */}
<div className="flex gap-3 pt-2">
  {/* 1/3 Width: Dead Hand (Secondary) */}
  {!isAdjustment && (
    <button 
      onClick={handleDeadHand}
      className="flex-[1] py-5 bg-white border-2 border-zinc-100 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-zinc-200 transition-all active:scale-95"
    >
      <span className="text-[14px]">💀</span>
      <span className="text-zinc-400 group-hover:text-zinc-500 text-[8px] font-black uppercase tracking-tighter leading-none">
        Dead Draw
      </span>
    </button>
  )}

  {/* 2/3 Width: Primary Action */}
  <button 
    disabled={!isAdjustment && (selectedLoser === null || winnerIdx === null)}
    onClick={handleConfirmWin}
    className={`flex-[2] py-5 rounded-2xl font-black text-lg uppercase transition-all active:scale-[0.98] shadow-xl 
      ${isAdjustment ? 'bg-amber-600 text-white' : 'bg-zinc-900 text-white'} 
      disabled:opacity-10 disabled:grayscale`}
  >
    {isAdjustment ? 'Fix' : 'Log Win'}
  </button>
</div>
        </div>
      </div>
    </>
  );
}