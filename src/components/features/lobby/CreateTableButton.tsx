'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AuthModal from '@/components/features/auth/AuthModal';

interface CreateTableButtonProps {
  userId?: string;
  authLoading?: boolean;
}

export default function CreateTableButton({ userId, authLoading }: CreateTableButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const router = useRouter();

  // This is the core logic for creating the table
  const createTable = async (currentUserId: string) => {
    setIsCreating(true);
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ 
        status: 'active',
        created_by: currentUserId,
        current_dealer_idx: 0,
        dealer_streak: 0,
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
      console.error("Failed to create session:", error?.message);
      alert("Database error: Could not start table.");
      setIsCreating(false);
    }
  };

  const handleAction = () => {
    if (!userId) {
      setIsAuthModalOpen(true);
    } else {
      createTable(userId);
    }
  };

  return (
    <>
      <button 
        disabled={isCreating || authLoading}
        onClick={handleAction}
        className={`w-full font-black py-5 px-8 rounded-3xl transition-all active:scale-95 shadow-md disabled:opacity-50 text-lg uppercase tracking-tight
          ${userId ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-zinc-900 hover:bg-black text-white'}`}
      >
        {authLoading ? 'LOADING...' : isCreating ? 'BUILDING TABLE...' : userId ? 'START NEW TABLE' : 'SIGN IN TO CREATE TABLE'}
      </button>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // Note: Since auth state change is async, we don't call createTable here.
          // The component will re-render with the new userId, and the user 
          // can click 'START NEW TABLE' once the button transforms.
        }} 
      />
    </>
  );
}