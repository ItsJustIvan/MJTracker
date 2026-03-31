// Inside ManageSeatModal.tsx
export default function ManageSeatModal({ isOpen, onClose, onLeave, onSignup, name, isGuest }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold leading-tight">{name}</h3>
            <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400">
              {isGuest ? 'Guest Player' : 'Verified Profile'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">✕</button>
        </div>

        <div className="space-y-3">
          {/* ONLY SHOW SIGN UP IF THEY ARE A GUEST */}
          {isGuest && (
            <button 
              onClick={onSignup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span>✨</span> Save my Stats (Sign Up)
            </button>
          )}

          {/* ALWAYS SHOW LEAVE SEAT */}
          <button 
            onClick={onLeave}
            className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-xl font-bold border border-red-100 dark:border-red-900/30 transition-transform active:scale-95"
          >
            Leave Seat
          </button>
        </div>
        
        <p className="text-[10px] text-zinc-500 text-center mt-6">
          {isGuest 
            ? "Your progress is temporary. Sign up to track lifetime wins." 
            : "Vacating this seat will allow another player to join."}
        </p>
      </div>
    </div>
  );
}