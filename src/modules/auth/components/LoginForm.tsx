'use client'
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Input from '@/components/ui/Input';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <Input 
        label="Email Address" 
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
      
      {error && (
        <p className="text-red-500 text-[10px] font-black uppercase tracking-tight px-1">
          {error}
        </p>
      )}

      <button 
        disabled={loading}
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white p-5 rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}