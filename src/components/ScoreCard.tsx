'use client'
import React from 'react';

interface ScoreCardProps {
  index: number;
  name: string;
  score: number;
  windIdx: number; // 0: East, 1: South, 2: West, 3: North
  isDealer: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const WINDS = ['東', '南', '西', '北'];
const WIND_NAMES = ['East', 'South', 'West', 'North'];

export default function ScoreCard({ 
  name, 
  score, 
  windIdx, 
  isDealer, 
  isSelected, 
  onClick 
}: ScoreCardProps) {
  
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-200 text-left
        ${isSelected 
          ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 shadow-lg scale-[1.02]' 
          : 'bg-white border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800'
        }
      `}
    >
      {/* Wind Indicator Tag */}
      <div className={`
        absolute -top-3 left-4 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1
        ${isDealer 
          ? 'bg-orange-500 text-white shadow-orange-500/20 shadow-lg' 
          : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        }
      `}>
        <span className="text-sm leading-none">{WINDS[windIdx]}</span>
        <span>{WIND_NAMES[windIdx]}</span>
      </div>

      {/* Player Identity */}
      <div className="mt-2">
        <h3 className="font-bold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-tight truncate">
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-black tabular-nums tracking-tighter ${score < 0 ? 'text-rose-500' : 'text-zinc-900 dark:text-white'}`}>
            {score}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">pts</span>
        </div>
      </div>

      {/* Visual Selection Feedback */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      )}
    </button>
  );
}