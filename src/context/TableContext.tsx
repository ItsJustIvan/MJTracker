'use client'
import React, { createContext, useContext, useMemo, useEffect } from 'react'; // 👈 Added useEffect
import { useSessionIdentity } from '@/hooks/useSessionIdentity';
import { useGameState } from '@/hooks/useGameState';
import { useSessionPlayers } from '@/hooks/useSessionPlayers';
import { useSessionScores } from '@/hooks/useSessionScores';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useScoringActions } from '@/hooks/useScoringActions';

const TableContext = createContext<any>(null);

export function TableProvider({ sessionId, user, profile, children }: any) {
  // 1. Initialize all 5 pillars FIRST
  const identity = useSessionIdentity(sessionId, user);
  const gameState = useGameState(sessionId);
  const players = useSessionPlayers(sessionId);
  const scores = useSessionScores(sessionId);
  const historyData = useSessionHistory(sessionId);
  const scoring = useScoringActions(
    sessionId, 
    gameState.currentDealerIdx, 
    gameState.dealerStreak,
    gameState.refreshSessionState
  );

  // 2. NOW run the Migration Effect
  useEffect(() => {
    // Check if we have both a Guest ID and a Logged-in User
    if (user?.id && identity.guestId) {
      console.log("🔄 [Identity]: User logged in, triggering migration...");
      identity.handleIdentityUpgrade();
    }
  }, [user?.id, identity.guestId, identity.handleIdentityUpgrade]); // 👈 Added dependencies

  // 3. Create a combined "Permissions" object
const permissions = useMemo(() => {
    // Determine if the table is in a read-only state
    const isClosed = gameState.status === 'closed' || gameState.status === 'archived';

    return {
      isAdmin: profile?.is_admin || false,
      isSeated: !!players.sessionPlayers.find(p => identity.isMySeat(p)),
      mySeatIndex: players.sessionPlayers.find(p => identity.isMySeat(p))?.seat_index ?? null,
      
      // canRecord is false if the table is closed
      canRecord: gameState.status === 'active' && !isClosed,
      
      // Export the explicit flag for UI usage (SeatAction, etc.)
      isTableClosed: isClosed 
    };
  }, [players.sessionPlayers, identity, gameState.status, profile]);
  // 4. Bundle everything
  const value = {
    sessionId,
    user,
    profile,
    ...identity,
    ...gameState,
    ...players,
    ...scores,
    ...historyData,
    ...scoring,
    permissions
  };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}

export const useTable = () => {
  const context = useContext(TableContext);
  if (!context) throw new Error("useTable must be used within a TableProvider");
  return context;
};