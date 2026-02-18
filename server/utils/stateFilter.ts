/**
 * State Filter
 * Filters game state to ensure players only see their own hands
 */

import { GameState, Player, Card, Suit, Rank } from '../types';

/**
 * Creates a hidden card placeholder
 * @returns A card object representing a hidden card
 */
function createHiddenCard(): Card {
  return {
    id: 'hidden',
    suit: 'hearts' as Suit,
    rank: 'A' as Rank
  };
}

/**
 * Filters game state for a specific player
 * Removes other players' hands to prevent cheating
 * @param gameState - The full game state
 * @param playerId - The ID of the player receiving the state
 * @returns Filtered game state with only the player's hand visible
 */
export function filterGameStateForPlayer(gameState: GameState, playerId: string): GameState {
  return {
    ...gameState,
    players: gameState.players.map(player => {
      if (player.id === playerId) {
        // Player can see their own hand
        return player;
      } else {
        // Other players' hands are hidden - show count but not actual cards
        return {
          ...player,
          hand: player.hand.map(() => createHiddenCard())
        };
      }
    })
  };
}

/**
 * Filters game state for broadcast to all players
 * Each player receives a version with only their hand visible
 * @param gameState - The full game state
 * @returns Map of playerId to filtered game state
 */
export function filterGameStateForBroadcast(gameState: GameState): Map<string, GameState> {
  const filteredStates = new Map<string, GameState>();
  
  for (const player of gameState.players) {
    filteredStates.set(player.id, filterGameStateForPlayer(gameState, player.id));
  }
  
  return filteredStates;
}

/**
 * Creates a spectator-safe game state
 * All hands are hidden for spectators
 * @param gameState - The full game state
 * @returns Game state with all hands hidden
 */
export function filterGameStateForSpectator(gameState: GameState): GameState {
  return {
    ...gameState,
    players: gameState.players.map(player => ({
      ...player,
      hand: player.hand.map(() => createHiddenCard())
    }))
  };
}
