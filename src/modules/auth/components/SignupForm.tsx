'use client'
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Input from '@/components/shared/ui/Input';

export default function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          display_name: displayName,
          full_name: displayName // Common to map to both
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <Input 
        label="Display Name" 
        placeholder="How you appear on the table"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
      <Input 
        label="Email" 
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input 
        label="Password" 
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}

      <button 
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}