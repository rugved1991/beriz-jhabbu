import { GamePhase, GameState } from '../types';

/**
 * State machine for managing game phase transitions
 * Validates and executes transitions according to game rules
 */

/**
 * Valid state transitions in the game
 */
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  SETUP: ['LOBBY'],
  LOBBY: ['DEALING'],
  DEALING: ['BERIZ'],
  BERIZ: ['JHABBU'],
  JHABBU: ['GAME_OVER'],
  GAME_OVER: [], // Terminal state
};

/**
 * Validates if a transition from one phase to another is allowed
 * @param currentPhase - The current game phase
 * @param targetPhase - The desired target phase
 * @returns true if the transition is valid, false otherwise
 */
export function isValidTransition(currentPhase: GamePhase, targetPhase: GamePhase): boolean {
  return VALID_TRANSITIONS[currentPhase].includes(targetPhase);
}

/**
 * Transition from SETUP to LOBBY (room created)
 * @param gameState - Current game state
 * @returns Updated game state in LOBBY phase
 */
export function transitionToLobby(gameState: GameState): GameState {
  if (!isValidTransition(gameState.phase, 'LOBBY')) {
    throw new Error(`Invalid transition from ${gameState.phase} to LOBBY`);
  }

  return {
    ...gameState,
    phase: 'LOBBY',
  };
}

/**
 * Transition from LOBBY to DEALING (host starts game)
 * @param gameState - Current game state
 * @returns Updated game state in DEALING phase
 */
export function transitionToDealing(gameState: GameState): GameState {
  if (!isValidTransition(gameState.phase, 'DEALING')) {
    throw new Error(`Invalid transition from ${gameState.phase} to DEALING`);
  }

  // Validate that we have at least 2 players
  if (gameState.players.length < 2) {
    throw new Error('Cannot start game with less than 2 players');
  }

  return {
    ...gameState,
    phase: 'DEALING',
  };
}

/**
 * Transition from DEALING to BERIZ (dealing complete)
 * @param gameState - Current game state
 * @returns Updated game state in BERIZ phase
 */
export function transitionToBeriz(gameState: GameState): GameState {
  if (!isValidTransition(gameState.phase, 'BERIZ')) {
    throw new Error(`Invalid transition from ${gameState.phase} to BERIZ`);
  }

  // Validate that all cards have been dealt (all players have cards)
  const allPlayersHaveCards = gameState.players.every(player => player.hand.length > 0);
  if (!allPlayersHaveCards) {
    throw new Error('Cannot transition to BERIZ: not all players have cards');
  }

  return {
    ...gameState,
    phase: 'BERIZ',
    currentPlayerIndex: 0, // Start with first player
  };
}

/**
 * Transition from BERIZ to JHABBU (Phase 1 complete)
 * @param gameState - Current game state
 * @returns Updated game state in JHABBU phase
 */
export function transitionToJhabbu(gameState: GameState): GameState {
  if (!isValidTransition(gameState.phase, 'JHABBU')) {
    throw new Error(`Invalid transition from ${gameState.phase} to JHABBU`);
  }

  // Note: We don't validate empty hands here because transitionToPhase2()
  // has already moved sideDeck cards to hand. The validation that Phase 1
  // is complete happens in handlePhase1CardPlay via checkPhase1Completion.

  // Table should be cleared when transitioning to Phase 2
  return {
    ...gameState,
    phase: 'JHABBU',
    table: [],
    leadSuit: null,
    trickCards: [],
    currentPlayerIndex: 0, // Reset to first player or last player from Phase 1
  };
}

/**
 * Transition from JHABBU to GAME_OVER (loser determined)
 * @param gameState - Current game state
 * @returns Updated game state in GAME_OVER phase
 */
export function transitionToGameOver(gameState: GameState): GameState {
  if (!isValidTransition(gameState.phase, 'GAME_OVER')) {
    throw new Error(`Invalid transition from ${gameState.phase} to GAME_OVER`);
  }

  // Validate that only one player remains with cards (the loser)
  // In Phase 2 (JHABBU), check hand.length instead of sideDeck.length
  const playersWithCards = gameState.players.filter(
    player => player.hand.length > 0
  );

  if (playersWithCards.length !== 1) {
    throw new Error(
      `Cannot transition to GAME_OVER: expected 1 player with cards, found ${playersWithCards.length}`
    );
  }

  const loser = playersWithCards[0];

  return {
    ...gameState,
    phase: 'GAME_OVER',
    loser: loser.id,
  };
}

/**
 * Generic transition function that routes to the appropriate transition handler
 * @param gameState - Current game state
 * @param targetPhase - The desired target phase
 * @returns Updated game state in the target phase
 */
export function transitionToPhase(gameState: GameState, targetPhase: GamePhase): GameState {
  switch (targetPhase) {
    case 'LOBBY':
      return transitionToLobby(gameState);
    case 'DEALING':
      return transitionToDealing(gameState);
    case 'BERIZ':
      return transitionToBeriz(gameState);
    case 'JHABBU':
      return transitionToJhabbu(gameState);
    case 'GAME_OVER':
      return transitionToGameOver(gameState);
    case 'SETUP':
      throw new Error('Cannot transition back to SETUP phase');
    default:
      throw new Error(`Unknown target phase: ${targetPhase}`);
  }
}
