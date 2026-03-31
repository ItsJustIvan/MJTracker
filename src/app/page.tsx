'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function MahjongTable() {
  const [scores, setScores] = useState([0, 0, 0, 0])
  const tableCode = 'LV-01'

  useEffect(() => {
    const channel = supabase
      .channel('realtime-mahjong')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_tables', filter: `table_code=eq.${tableCode}` },
        (payload) => {
          setScores(payload.new.scores)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateScore = async (index: number, delta: number) => {
    const newScores = [...scores]
    newScores[index] = Math.max(0, newScores[index] + delta) // No negative scores

    await supabase
      .from('live_tables')
      .update({ scores: newScores })
      .eq('table_code', tableCode)
  }

  const winds = ['🀀 East', '🀁 South', '🀂 West', '🀃 North']

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-500">MJTracker v0.1</h1>
          <p className="text-slate-500">Table: {tableCode}</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {scores.map((score, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-tighter">{winds[i]}</p>
                <p className="text-5xl font-black tabular-nums">{score}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateScore(i, -1)} className="w-16 h-16 bg-slate-800 rounded-xl text-2xl border border-slate-700 active:bg-red-900">-</button>
                <button onClick={() => updateScore(i, 1)} className="w-16 h-16 bg-emerald-600 rounded-xl text-2xl font-bold active:scale-95">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}