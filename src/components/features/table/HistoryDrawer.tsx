'use client'
import React from 'react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: any[];
}

export default function HistoryDrawer({ isOpen, onClose, history }: HistoryDrawerProps) {
  return (
    <div className={`fixed right-0 top-0 h-full w-full max-w-sm bg-zinc-950 z-[120] shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-zinc-800 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="p-8 flex flex-col h-full text-white">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            ← BACK
          </button>
          <h2 className="text-xl font-black italic tracking-tighter">GAME LOG</h2>
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-hide">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <p className="text-xs font-black uppercase tracking-widest">No Rounds Yet</p>
            </div>
          ) : (
            history.map((round, idx) => (
              <div key={round.id || idx} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl relative group">
                
                {/* Top Row: Hand Number and Streak */}
                <div className="flex justify-between items-end mb-4 border-b border-zinc-800/50 pb-2">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">
                    Round {history.length - idx}
                  </span>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-zinc-500 uppercase leading-none mb-1">Dealer Streak</p>
                    <p className="text-xs font-black text-emerald-500 leading-none">{round.dealer_streak_at_time}</p>
                  </div>
                </div>

                {/* Main Content: Winner from Loser */}
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Winner</p>
                    <p className="text-sm font-bold text-white">
                      {round.result_type === 'dead_hand' ? (
                        <span className="text-zinc-600 italic">No Winner</span>
                      ) : (
                        <>
                          <span className="text-emerald-400">{round.winner_name}</span>
                          <span className="text-zinc-600 font-medium mx-2 lowercase">from</span>
                          <span className="text-zinc-300">{round.loser_name}</span>
                        </>
                      )}
                    </p>
                    <div className="pt-1">
                       <span className="text-[9px] font-black px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase tracking-tighter">
                        {round.result_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Big Score */}
                  <div className="text-right">
                    <p className={`text-2xl font-black italic tracking-tighter ${
                      round.net_win_amount > 0 ? 'text-white' : 'text-zinc-700'
                    }`}>
                      {round.net_win_amount > 0 ? `+${round.net_win_amount}` : '0'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}