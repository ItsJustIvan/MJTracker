export default function ManageSeatModal({ isOpen, onClose, onLeave, onSignup, name }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Hello, {name}</h3>
          <button onClick={onClose} className="text-zinc-500 text-sm">Close</button>
        </div>

        <div className="space-y-3">
          {/* THE UPGRADE PATH */}
          <button 
            onClick={onSignup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <span>✨</span> Save my Stats (Sign Up)
          </button>

          {/* THE LEAVE OPTION */}
          <button 
            onClick={onLeave}
            className="w-full bg-zinc-100 dark:bg-zinc-800 text-red-500 p-4 rounded-xl font-bold"
          >
            Leave Seat
          </button>
        </div>
        
        <p className="text-[10px] text-zinc-500 text-center mt-4">
          Leaving will vacate the seat for another player.
        </p>
      </div>
    </div>
  );
}