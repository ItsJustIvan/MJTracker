'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface CreateTableButtonProps {
  userId?: string;
  authLoading: boolean;
}

export default function CreateTableButton({ userId, authLoading }: CreateTableButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createTable = async (currentUserId: string | undefined) => {
    setIsCreating(true);
    
    // Fallback: If no user ID, we send null (Bucket A trigger handles the rest)
    const creator = currentUserId || null;

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ 
        created_by: creator,
        status: 'active',
        rules: {
          dealer_points_enabled: true,
          base_dealer_bonus: 1,
          streak_multiplier: 2
        }
      }])
      .select('id')
      .single();

    if (!error && data) {
      router.push(`/table/${data.id}`);
    } else {
      console.error("🚫 [Table Creation Failed]:", error?.message);
      alert(`Error: ${error?.message || "Could not start table."}`);
      setIsCreating(false);
    }
  };

  return (
    <button 
      onClick={() => createTable(userId)}
      disabled={isCreating || authLoading}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 px-8 rounded-3xl transition-all active:scale-95 text-lg uppercase tracking-tight disabled:opacity-50"
    >
      {isCreating ? "CREATING..." : "START NEW TABLE"}
    </button>
  );
}