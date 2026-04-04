'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// 1. Define the props interface
interface CreateTableButtonProps {
  userId?: string;
  authLoading: boolean;
}
// 2. Export the component as DEFAULT
export default function CreateTableButton({ userId, authLoading }: CreateTableButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createTable = async (currentUserId: string | undefined) => {
    
const createTable = async (currentUserId: string) => {
    setIsCreating(true);
    
    // We only send the minimum "Contract" data. 
    // The Database Trigger handles: current_dealer_idx, prevalent_wind, hand_number,
    // and creates the 4 session_players and 4 session_scores automatically.
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ 
        created_by: currentUserId,
        status: 'active', // Optional: could also be a DB default
        rules: {
          dealer_points_enabled: true,
          base_dealer_bonus: 1,
          streak_multiplier: 2
        }
        // Note: NO dealer_idx or hand_number here. The DB Trigger handles it.
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
  };

  return (
    <button 
      onClick={() => createTable(userId)}
      disabled={isCreating || authLoading}
      className="..."
    >
      {isCreating ? "CREATING..." : "START NEW TABLE"}
    </button>
  );
}