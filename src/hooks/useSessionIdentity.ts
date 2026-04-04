export function useSessionIdentity(sessionId: string, authUser: any) {
  const [guestId, setGuestId] = useState<string | null>(null);
  const isMigrating = useRef(false);

  // 1. Ensure a Guest ID exists for the browser
  useEffect(() => {
    let id = localStorage.getItem('mahjong_guest_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('mahjong_guest_id', id);
    }
    setGuestId(id);
  }, []);

  // 2. Logic to "Upgrade" a guest to a profile
  const handleIdentityUpgrade = async () => {
    if (!authUser?.id || !guestId || isMigrating.current) return;
    
    isMigrating.current = true;
    await supabase.rpc('migrate_guest_to_player', {
      p_guest_session_id: guestId,
      p_profile_id: authUser.id
    });
    isMigrating.current = false;
  };

  return {
    guestId,
    handleIdentityUpgrade,
    // Helper to check if a specific player row belongs to the current user
    isMySeat: (playerRecord: any) => {
      if (authUser?.id && playerRecord.profile_id === authUser.id) return true;
      if (guestId && playerRecord.guest_session_id === guestId && !playerRecord.profile_id) return true;
      return false;
    }
  };
}