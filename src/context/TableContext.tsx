'use client'
import React, { createContext, useContext, useMemo } from 'react';
import { useSessionIdentity } from '@/hooks/useSessionIdentity';
import { useGameState } from '@/hooks/useGameState';
import { useSessionPlayers } from '@/hooks/useSessionPlayers';
import { useSessionScores } from '@/hooks/useSessionScores';
import { useSessionHistory } from '@/hooks/useSessionHistory';

// 1. Define the shape of our "Big Data Object"
const TableContext = createContext<any>(null);

export function TableProvider({ sessionId, user, profile, children }: any) {
  // 2. Initialize all 5 pillars
  const identity = useSessionIdentity(sessionId, user);
  const gameState = useGameState(sessionId);
  const players = useSessionPlayers(sessionId);
  const scores = useSessionScores(sessionId);
  const history = useSessionHistory(sessionId);

  // 3. Create a combined "Permissions" object
  const permissions = useMemo(() => ({
    isAdmin: profile?.is_admin || false,
    isSeated: !!players.sessionPlayers.find(p => identity.isMySeat(p)),
    mySeatIndex: players.sessionPlayers.find(p => identity.isMySeat(p))?.seat_index ?? null,
    canRecord: gameState.status === 'active'
  }), [players.sessionPlayers, identity, gameState.status, profile]);

  // 4. Bundle everything into one value
  const value = {
    sessionId,
    ...identity,
    ...gameState,
    ...players,
    ...scores,
    ...history,
    permissions
  };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}

// 5. Create a custom hook so components can "Listen" to the table
export const useTable = () => {
  const context = useContext(TableContext);
  if (!context) throw new Error("useTable must be used within a TableProvider");
  return context;
};