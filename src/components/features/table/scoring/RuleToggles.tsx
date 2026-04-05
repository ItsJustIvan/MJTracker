// ParticipantSelector.tsx
import React from 'react';

// RuleToggles.tsx
interface Props {
  canAuthFixMode: boolean;
  isAdjustment: boolean;
  setIsAdjustment: (val: boolean) => void;
  isDealerPointsOn: boolean;
  setIsDealerPointsOn: (val: boolean) => void;
}

export const RuleToggles = ({ 
  canAuthFixMode, isAdjustment, setIsAdjustment, 
  isDealerPointsOn, setIsDealerPointsOn 
}: Props) => (
  <div className="flex flex-col gap-3">
    {/* Admin Fix Mode */}
    {canAuthFixMode && (
      <button 
        onClick={() => setIsAdjustment(!isAdjustment)}
        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isAdjustment ? 'border-amber-200 bg-amber-50' : 'border-zinc-100 opacity-40'}`}
      >
        <span className="text-[10px] font-black uppercase tracking-tighter">Fix Mode (Admin)</span>
        <div className={`w-8 h-4 rounded-full relative ${isAdjustment ? 'bg-amber-500' : 'bg-zinc-200'}`}>
          <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${isAdjustment ? 'left-5' : 'left-1'}`} />
        </div>
      </button>
    )}

    {/* Dealer Points Toggle */}
    {!isAdjustment && (
      <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Dealer Points</span>
          <span className="text-[8px] font-medium text-zinc-400 uppercase italic">Apply bonus + stay on win</span>
        </div>
        <button 
          onClick={() => setIsDealerPointsOn(!isDealerPointsOn)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isDealerPointsOn ? 'bg-emerald-500' : 'bg-zinc-300'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDealerPointsOn ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
    )}
  </div>
);