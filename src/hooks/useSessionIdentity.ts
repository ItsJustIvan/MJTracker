'use client'
import { useState, useEffect } from 'react';

export function useSessionIdentity(sessionId: string, authUser: any) {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('mahjong_guest_id') || crypto.randomUUID();
    if (!localStorage.getItem('mahjong_guest_id')) {
      localStorage.setItem('mahjong_guest_id', id);
    }
    setGuestId(id);
  }, []);

  // New helper to wipe the guest footprint after migration
  const clearGuestIdentity = () => {
    localStorage.removeItem('mahjong_guest_id');
    localStorage.removeItem('mahjong_guest_name');
    setGuestId(null);
  };

  return {
    guestId,
    clearGuestIdentity,
    isMySeat: (playerRecord: any) => {
      if (!playerRecord) return false;
      if (authUser?.id && playerRecord.profile_id === authUser.id) return true;
      if (guestId && playerRecord.guest_session_id === guestId && !playerRecord.profile_id) return true;
      return false;
    }
  };
}