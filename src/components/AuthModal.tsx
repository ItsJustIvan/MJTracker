'use client'
import React from 'react'; // Add this just to be safe
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabaseClient'

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-8 rounded-2xl shadow-2xl relative border dark:border-zinc-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
        >
          ✕
        </button>
        <h2 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tighter text-center">
          Join the Table
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#10b981', // emerald-500 to match your theme
                  brandAccent: '#059669',
                }
              }
            }
          }}
          providers={['google']} 
          theme="dark"
        />
      </div>
    </div>
  );
}