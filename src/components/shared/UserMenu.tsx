'use client'
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BaseModal from '@/components/shared/ui/BaseModal';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  user: any;
  profile: any;
}

export default function UserMenu({ user, profile }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'history' | 'league' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // State for editing
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);

  // Keep displayName in sync if the profile prop changes
  useEffect(() => {
    setDisplayName(profile?.display_name || '');
  }, [profile]);

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
    window.location.href = '/'; 
  };

  // --- THE MISSING FUNCTION ---
  const handleUpdateProfile = async () => {
    if (!user?.id || !displayName.trim()) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);

    if (error) {
      console.error('Update failed:', error.message);
      alert('Failed to update profile');
    } else {
      setActiveModal(null);
      router.refresh(); // Tells Next.js to update data on the page
    }
    setIsSaving(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* TRIGGER */}
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
        </div>
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] border border-zinc-100 shadow-2xl z-[100] overflow-hidden p-2">
          <div className="px-5 py-4 bg-zinc-50 rounded-t-[1.5rem] mb-1">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Account</p>
            <p className="text-sm font-black text-zinc-900 truncate">{user.email}</p>
          </div>

          <div className="space-y-1">
            <button 
              onClick={() => { setActiveModal('profile'); setIsOpen(false); }}
              className="w-full text-left px-5 py-3 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-colors flex justify-between items-center group"
            >
              Edit Profile <span>✎</span>
            </button>
            <button 
              onClick={() => { setActiveModal('league'); setIsOpen(false); }}
              className="w-full text-left px-5 py-3 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-colors"
            >
              League Stats
            </button>
            <button 
              onClick={() => { setActiveModal('history'); setIsOpen(false); }}
              className="w-full text-left px-5 py-3 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-colors"
            >
              Career History
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

      {/* --- MODALS FOR FUNCTIONALITY --- */}
      
      {/* 1. EDIT PROFILE MODAL (FIXED) */}
      <BaseModal 
        isOpen={activeModal === 'profile'} 
        onClose={() => setActiveModal(null)}
        title="Edit Profile"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Display Name</label>
            <input 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter name..."
              disabled={isSaving}
              className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-zinc-100 focus:border-emerald-500 outline-none font-bold disabled:opacity-50"
            />
          </div>
          <button 
            onClick={handleUpdateProfile}
            disabled={isSaving || !displayName.trim()}
            className="w-full bg-zinc-900 text-white p-4 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </BaseModal>

      {/* 2. CAREER HISTORY */}
      <BaseModal 
        isOpen={activeModal === 'history'} 
        onClose={() => setActiveModal(null)}
        title="Career History"
      >
        <div className="py-8 text-center space-y-2">
          <div className="text-4xl">🀄</div>
          <p className="text-zinc-500 font-medium">Global history coming soon.</p>
          <p className="text-[10px] text-zinc-300 font-black uppercase">Feature in development</p>
        </div>
      </BaseModal>

      {/* 3. LEAGUE STANDINGS */}
      <BaseModal 
        isOpen={activeModal === 'league'} 
        onClose={() => setActiveModal(null)}
        title="League Standings"
      >
        <div className="py-8 text-center space-y-2">
          <div className="text-4xl">🏆</div>
          <p className="text-zinc-500 font-medium">Track your rank across all tables.</p>
          <button className="text-emerald-600 text-[10px] font-black uppercase border border-emerald-100 px-3 py-1 rounded-full">
            Coming Soon
          </button>
        </div>
      </BaseModal>
    </div>
  );
}