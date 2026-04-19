'use client'
import React, { useState, useEffect } from 'react';
import { useTable } from '@/context/TableContext';
import BaseDrawer from '@/components/shared/ui/BaseDrawer';
import { RuleToggles } from './RuleToggles';
import { PointGrid } from './PointGrid';
import { ParticipantSelector } from './ParticipantSelector';

interface ScoringDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  winnerIdx: number | null;
  playerNames: string[];
}

export default function ScoringDrawer({ 
  isOpen, 
  onClose, 
  winnerIdx, 
  playerNames 
}: ScoringDrawerProps) {
  
  // 1. Consume Context
  const { recordHand, getWindForSeat, permissions, user, tableData } = useTable();

  // 2. Local UI State
  const [points, setPoints] = useState(3);
  const [selectedLoser, setSelectedLoser] = useState<number | 'all' | null>(null);
  const [isAdjustment, setIsAdjustment] = useState(false);
  const [isDealerPointsOn, setIsDealerPointsOn] = useState(true);

  // Reset logic when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedLoser(null);
      setPoints(3);
      setIsAdjustment(false);
      setIsDealerPointsOn(true);
    }
  }, [isOpen]);

  const handleDeadHand = () => {
    recordHand({
      resultType: 'dead_hand',
      points: 0,
      winnerIdx, // Still track who was dealer/active
      loserIdx: null,
      isDealerPointsOn: true 
    });
    onClose();
  };

  const handleConfirmWin = () => {
    if (winnerIdx === null || (selectedLoser === null && !isAdjustment)) return;
    
    recordHand({
      resultType: isAdjustment ? 'adjustment' : 'win',
      points,
      winnerIdx,
      loserIdx: selectedLoser,
      isDealerPointsOn
    });
    onClose();
  };

  const winnerName = winnerIdx !== null ? playerNames[winnerIdx] : "Select Winner";
  const canAuthFixMode = permissions.isAdmin || (user && tableData?.created_by === user.id);

  return (
    <BaseDrawer isOpen={isOpen} onClose={onClose}>
      <div className="max-w-md mx-auto px-2 pb-6 space-y-8">
        
        {/* Header Section */}
        <div className="border-b border-zinc-100 pb-4">
           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Recording Win For</p>
           <h2 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter truncate">
             {winnerName}
           </h2>
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

        {/* 4. Action Buttons */}
        <div className="flex gap-3 pt-4">
          {!isAdjustment && (
            <button 
              onClick={handleDeadHand}
              className="flex-1 py-5 bg-white border-2 border-zinc-100 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-zinc-200 transition-all active:scale-95"
            >
              <span className="text-xl">💀</span>
              <span className="text-zinc-400 group-hover:text-zinc-600 text-[9px] font-black uppercase tracking-tighter">
                Dead Draw
              </span>
            </button>
          )}

          <button 
            disabled={!isAdjustment && (selectedLoser === null || winnerIdx === null)}
            onClick={handleConfirmWin}
            className={`flex-[2] py-5 rounded-2xl font-black text-lg uppercase transition-all active:scale-[0.98] shadow-xl 
              ${isAdjustment ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-white'} 
              disabled:opacity-20 disabled:grayscale`}
          >
            {isAdjustment ? 'Apply Adjustment' : 'Confirm Win'}
          </button>
        </div>
      </div>
    </BaseDrawer>
  );
}