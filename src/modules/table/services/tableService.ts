import { supabase } from '@/lib/supabaseClient';

export const TableService = {
  /**
   * Moves guest session data to a permanent profile
   */
  async migrateGuestToPlayer(guestId: string, userId: string) {
    const { data, error } = await supabase.rpc('migrate_guest_to_player', {
      p_guest_session_id: guestId,
      p_profile_id: userId
    });
    if (error) throw error;
    return data;
  },

  /**
   * Standardized seat claiming for both Guests and Members
   */
  async claimSeat({ sessionId, seatIndex, userId, guestId, guestName, isVacating }: any) {
    const { error } = await supabase.rpc('claim_seat_v3', {
      p_session_id: sessionId,
      p_seat_index: seatIndex,
      p_profile_id: userId || null,
      p_guest_session_id: guestId || null,
      p_guest_name: guestName || null,
      p_is_vacating: isVacating || false
    });
    if (error) throw error;
  }
};