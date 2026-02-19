import { GamePhase, GameState } from '../types';
/**
 * Validates if a transition from one phase to another is allowed
 * @param currentPhase - The current game phase
 * @param targetPhase - The desired target phase
 * @returns true if the transition is valid, false otherwise
 */
export declare function isValidTransition(currentPhase: GamePhase, targetPhase: GamePhase): boolean;
/**
 * Transition from SETUP to LOBBY (room created)
 * @param gameState - Current game state
 * @returns Updated game state in LOBBY phase
 */
export declare function transitionToLobby(gameState: GameState): GameState;
/**
 * Transition from LOBBY to DEALING (host starts game)
 * @param gameState - Current game state
 * @returns Updated game state in DEALING phase
 */
export declare function transitionToDealing(gameState: GameState): GameState;
/**
 * Transition from DEALING to BERIZ (dealing complete)
 * @param gameState - Current game state
 * @returns Updated game state in BERIZ phase
 */
export declare function transitionToBeriz(gameState: GameState): GameState;
/**
 * Transition from BERIZ to JHABBU (Phase 1 complete)
 * @param gameState - Current game state
 * @returns Updated game state in JHABBU phase
 */
export declare function transitionToJhabbu(gameState: GameState): GameState;
/**
 * Transition from JHABBU to GAME_OVER (loser determined)
 * @param gameState - Current game state
 * @returns Updated game state in GAME_OVER phase
 */
export declare function transitionToGameOver(gameState: GameState): GameState;
/**
 * Generic transition function that routes to the appropriate transition handler
 * @param gameState - Current game state
 * @param targetPhase - The desired target phase
 * @returns Updated game state in the target phase
 */
export declare function transitionToPhase(gameState: GameState, targetPhase: GamePhase): GameState;
//# sourceMappingURL=stateMachine.d.ts.map