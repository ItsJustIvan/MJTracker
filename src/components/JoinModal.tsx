import { useState } from 'react';

export default function JoinModal({ isOpen, onConfirm, onCancel, isLoggedIn }: any) {
  const [guestName, setGuestName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-full max-w-sm shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Claim this Seat?</h3>
        
        {!isLoggedIn && (
          <div className="mb-6">
            <label className="text-sm text-zinc-500 mb-2 block">Enter a nickname to play as a Guest:</label>
            <input 
              className="w-full p-3 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
              placeholder="e.g. VegasVince"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onConfirm(guestName)}
            disabled={!isLoggedIn && !guestName}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {isLoggedIn ? "Confirm Seat" : "Join as Guest"}
          </button>
          <button onClick={onCancel} className="text-zinc-500 py-2">Cancel</button>
        </div>
      </div>
    </div>
  );
}