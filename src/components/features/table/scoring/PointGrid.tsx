// PointGrid.tsx
interface Props {
  points: number;
  setPoints: (val: number) => void;
  isAdjustment: boolean;
}

export const PointGrid = ({ points, setPoints, isAdjustment }: Props) => (
  <div className="grid grid-cols-3 gap-4">
    <button onClick={() => setPoints(Math.max(1, points - 1))} className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 text-2xl font-black text-zinc-400">−</button>
    <div className={`flex flex-col items-center justify-center border-2 rounded-2xl ${isAdjustment ? 'border-amber-100 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/30'}`}>
      <span className={`text-3xl font-black tabular-nums tracking-tighter ${isAdjustment ? 'text-amber-900' : 'text-emerald-900'}`}>{points}</span>
      <span className={`text-[8px] font-black uppercase tracking-widest ${isAdjustment ? 'text-amber-600' : 'text-emerald-600'}`}>Points</span>
    </div>
    <button onClick={() => setPoints(points + 1)} className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 text-2xl font-black text-zinc-400">+</button>
  </div>
);