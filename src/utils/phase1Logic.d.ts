/**
 * Phase 1 (Beriz) game logic
 * Handles card play, penalty detection, and phase completion
 */
import { Card, Player } from '../types';
/**
 * Result of a Phase 1 card play action
 */
export interface Phase1PlayResult {
    success: boolean;
    error?: string;
    penaltyCards?: Card[];
    updatedPlayers: Player[];
    updatedTable: Card[];
    phase1Complete: boolean;
}
/**
 * Handles a card play in Phase 1 (Beriz).
 * Validates the card play, checks for penalties, moves penalty cards to side deck,
 * and updates the table state.
 *
 * @param playerId - ID of the player playing the card
 * @param card - The card being played
 * @param players - Current array of players
 * @param table - Current cards on the table
 * @returns Result object with updated game state
 */
export declare function handlePhase1CardPlay(playerId: string, card: Card, players: Player[], table: Card[]): Phase1PlayResult;
/**
 * Checks if Phase 1 is complete (all players have empty hands).
 *
 * @param players - Array of players
 * @returns true if all players have empty hands, false otherwise
 */
export declare function checkPhase1Completion(players: Player[]): boolean;
/**
 * Handles Phase 1 completion by moving all remaining table cards to the last player
 * who played a card (the player who emptied their hand last).
 *
 * @param lastPlayerId - ID of the last player who played a card
 * @param players - Current array of players
 * @param table - Current cards on the table
 * @returns Updated players array with table cards moved to last player's side deck
 */
export declare function handlePhase1Completion(lastPlayerId: string, players: Player[], table: Card[]): Player[];
//# sourceMappingURL=phase1Logic.d.ts.map