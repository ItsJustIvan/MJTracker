'use client'
import React, { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const toggleMode = () => setMode(prev => prev === 'login' ? 'signup' : 'login');

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'login' ? 'Welcome Back' : 'Create Account'}
    >
      <div className="space-y-6">
        {/* Render the appropriate form based on state */}
        {mode === 'login' ? (
          <LoginForm onSuccess={onSuccess} />
        ) : (
          <SignupForm onSuccess={onSuccess} />
        )}

        {/* The Toggle Link */}
        <div className="text-center pt-2">
          <button 
            onClick={toggleMode}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-600 transition-colors"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign Up" 
              : "Already a member? Sign In"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}