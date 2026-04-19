'use client'
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useSessionIdentity } from '@/hooks/useSessionIdentity';
import { useGameState } from '@/hooks/useGameState';
import { useSessionPlayers } from '@/hooks/useSessionPlayers';
import { useSessionScores } from '@/hooks/useSessionScores';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useScoringActions } from '@/hooks/useScoringActions';
// 1. IMPORT YOUR NEW SERVICE
import { TableService } from '@/modules/table/services/tableService';

const TableContext = createContext<any>(null);

export function TableProvider({ sessionId, user, profile, children }: any) {
  // Pillars
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

  // 2. THE ONLY MIGRATION EFFECT YOU NEED
  useEffect(() => {
    const runMigration = async () => {
      // Condition: We have a logged-in user AND a leftover guest identity
      if (user?.id && identity.guestId) {
        console.log("🔄 [TableContext]: Identity upgrade detected. Migrating...");
        
        try {
          // A. Call the stateless service
          await TableService.migrateGuestToPlayer(identity.guestId, user.id);
          
          // B. Wipe the guest data from localStorage/State
          // This prevents the effect from running again
          identity.clearGuestIdentity();
          
          // C. Refresh UI immediately
          if (players.refreshPlayers) await players.refreshPlayers();
          if (gameState.refreshSessionState) await gameState.refreshSessionState();
          
          console.log("✅ [TableContext]: Migration successful.");
        } catch (err) {
          console.error("🚫 [TableContext]: Migration failed", err);
        }
      }
    };

    runMigration();
  }, [user?.id, identity.guestId, identity, players, gameState]); 

  // 3. Permissions Calculation
  const permissions = useMemo(() => {
    const isClosed = gameState.status === 'closed' || gameState.status === 'archived';
    const myPlayer = players.sessionPlayers.find((p: any) => identity.isMySeat(p));

    return {
      isAdmin: profile?.is_admin || false,
      isSeated: !!myPlayer,
      mySeatIndex: myPlayer?.seat_index ?? null,
      canRecord: gameState.status === 'active' && !isClosed,
      isTableClosed: isClosed 
    };
  }, [players.sessionPlayers, identity, gameState.status, profile]);

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