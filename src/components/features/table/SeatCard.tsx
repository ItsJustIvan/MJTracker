'use client'
import React from 'react';

interface SeatCardProps {
  index: number;
  player: any;
  displayName: string;
  score: number;
  isDealer: boolean;
  dealerStreak: number;
  isGhost: boolean;
  isMySeat: boolean;
  onLeave: () => void;
  onSelect: () => void;
  onClaim: () => void;
}

export default function SeatCard({ 
  index, 
  player, 
  displayName, 
  score, 
  isDealer, 
  dealerStreak, 
  isGhost,
  isMySeat,
  onLeave,
  onSelect,
  onClaim 
}: SeatCardProps) {
  
  // Traditional Chinese + English Association
  const winds = [
    { zh: "東", en: "East" },
    { zh: "南", en: "South" },
    { zh: "西", en: "West" },
    { zh: "北", en: "North" }
  ];
  
  const currentWind = winds[index];
  
  return (
    <div 
      onClick={onSelect}
      className={`relative group flex flex-col justify-between p-5 rounded-[2.5rem] border-2 transition-all duration-300 min-h-[170px] ${
        isDealer 
          ? 'border-emerald-500 bg-emerald-50/50 shadow-md' 
          : isGhost 
            ? 'border-zinc-100 bg-zinc-50/50 border-dashed hover:border-zinc-200 cursor-pointer' 
            : 'border-zinc-100 bg-white hover:border-zinc-200 shadow-sm hover:shadow-md cursor-pointer'
      }`}
    >
      {/* 1. FLOATING DEALER TAG */}
      {isDealer && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1 rounded-full shadow-lg shadow-emerald-500/40 flex items-center gap-2 border border-white/20">
            Dealer {dealerStreak > 0 && <span className="opacity-60">× {dealerStreak}</span>}
          </div>
        </div>
      )}

      {/* 2. SEAT HEADER */}
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          <div className={`flex items-center gap-1.5 font-black tracking-tight ${isDealer ? 'text-emerald-600' : 'text-zinc-400'}`}>
            <span className="text-lg leading-none">{currentWind.zh}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] mt-0.5">{currentWind.en}</span>
          </div>
        </div>
        
        <span className={`text-sm transition-all duration-500 ${
          isGhost ? 'grayscale opacity-10 scale-75' : 'grayscale-0 opacity-100 scale-100'
        }`}>
          🀄
        </span>
      </div>

      {/* 3. PLAYER INFO & SCORE */}
      <div className="mt-4 mb-2 z-10">
        <div className="flex flex-col">
          <p className={`text-[11px] font-black uppercase tracking-tight truncate max-w-[140px] ${
            isGhost ? 'text-zinc-300 italic' : 'text-zinc-900'
          }`}>
            {displayName}
          </p>
          
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-4xl font-black tabular-nums tracking-tighter ${
              isDealer ? 'text-emerald-700' : isGhost ? 'text-zinc-300' : 'text-zinc-900'
            }`}>
              {score}
            </span>
            <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">pts</span>
          </div>
        </div>
      </div>

      {/* 4. CLAIM FOOTER (Conditional) */}
      <div className="pt-3 border-t border-zinc-100/50 flex items-center justify-between z-10">
        {isGhost ? (
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              onClaim();
            }}
            className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center gap-1 bg-emerald-100/50 px-4 py-1.5 rounded-full"
          >
            <span className="text-xs">+</span> Claim Seat
          </button>
        ) : isMySeat ? (
          /* STATE: MY SEAT */
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              onLeave();
            }}
            className="text-[9px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-4 py-1.5 rounded-full hover:bg-rose-100 transition-colors"
          >
            Leave Seat
          </button>
        ): (
          /* STATE: SOMEONE ELSE'S SEAT */
          <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Select to record win
          </span>
        )}
      </div>

      {/* BACKGROUND DECORATIVE WIND CHARACTER */}
      <div className={`absolute -bottom-6 -right-2 text-[120px] font-black pointer-events-none transition-all duration-1000 select-none leading-none ${
        isDealer ? 'text-emerald-500/10 rotate-6 scale-110' : 'text-zinc-500/5 -rotate-6 scale-90'
      }`}>
        {currentWind.zh}
      </div>
    </div>
  );
}