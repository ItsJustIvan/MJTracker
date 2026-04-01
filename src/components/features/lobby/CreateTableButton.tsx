'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface CreateTableButtonProps {
  userId?: string;
  authLoading?: boolean;
}

export default function CreateTableButton({ userId, authLoading }: CreateTableButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleStartNewTable = async () => {
    setIsCreating(true);
    
    // 🗝️ v0.3 Strategy: Use UUID internally
    const newId = crypto.randomUUID();

    const { error } = await supabase
      .from('sessions')
      .insert([{ 
        id: newId, 
        status: 'active',
        created_by: userId || null 
      }]);

    if (!error) {
      router.push(`/table/${newId}`);
    } else {
      console.error("Failed to create session:", error.message);
      alert("Database error: Could not start table.");
      setIsCreating(false);
    }
  };

  return (
    <button 
      disabled={isCreating || authLoading}
      onClick={handleStartNewTable}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 px-8 rounded-3xl transition-all active:scale-95 shadow-md disabled:opacity-50 text-lg uppercase tracking-tight"
    >
      {isCreating ? 'BUILDING TABLE...' : 'START NEW TABLE'}
    </button>
  );
}