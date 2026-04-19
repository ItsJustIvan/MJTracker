'use client'
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UserMenuProps {
  user: any;
  profile: any;
}

export default function UserMenu({ user, profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Hard redirect to clear all contexts
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all active:scale-95 group"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[10px] font-black group-hover:bg-emerald-600 transition-colors">
          {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[11px] font-black text-zinc-900 uppercase tracking-tight leading-none">
            {profile?.display_name || 'Player'}
          </p>
          <p className="text-[9px] font-bold text-zinc-400 leading-none mt-1">
            View Profile
          </p>
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] border border-zinc-100 shadow-2xl z-[100] overflow-hidden p-2">
          {/* Profile Header */}
          <div className="px-5 py-4 bg-zinc-50 rounded-t-[1.5rem] mb-1">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Account</p>
            <p className="text-sm font-black text-zinc-900 truncate">{user.email}</p>
          </div>

          <div className="space-y-1">
            <button className="w-full text-left px-5 py-3 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-colors flex justify-between items-center group">
              Edit Profile
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
            </button>
            <button className="w-full text-left px-5 py-3 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-colors">
              League Stats
            </button>
            <button className="w-full text-left px-5 py-3 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-colors">
              History
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-50">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-5 py-4 hover:bg-rose-50 rounded-b-[1.5rem] text-sm font-black text-rose-500 uppercase tracking-widest transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}