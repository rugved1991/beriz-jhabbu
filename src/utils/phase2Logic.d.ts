/**
 * Phase 2 (Jhabbu) game logic
 * Handles round play, card validation, Jhabbu Receiver determination, and player elimination
 *
 * In Phase 2, the side deck from Phase 1 becomes the hand.
 * Players play from their hand, competing to empty it first.
 *
 * **Normal Round (No Jhabbu Dump):**
 * - All cards are discarded (removed from game)
 * - Player with highest card of lead suit leads next round
 * - Everyone successfully sheds their cards (good!)
 *
 * **Round with Jhabbu Dump:**
 * - Jhabbu Giver dumps multiple cards (offensive move)
 * - All cards go to Jhabbu Receiver's hand (penalty for Jhabbu Receiver)
 * - Jhabbu Giver leads next round (if they still have cards)
 * - Jhabbu Receiver gets stuck with all cards (bad!)
 *
 * The goal is to empty your hand - the last player with cards loses.
 */
import { Card, Player, TrickCard, Suit } from '../types';
/**
 * Result of a Phase 2 round play action
 */
export interface Phase2PlayResult {
    success: boolean;
    error?: string;
    updatedPlayers: Player[];
    updatedTrickCards: TrickCard[];
    leadSuit: Suit | null;
    trickComplete: boolean;
    trickWinnerId?: string;
    nextLeaderId?: string;
    wasJhabbu?: boolean;
    jhabbuCardCount?: number;
    jhabbuGiverId?: string;
}
/**
 * Handles a card play in Phase 2 (Jhabbu).
 * Validates the card play, collects round cards, determines Jhabbu Receiver when round is complete,
 * moves cards to Jhabbu Receiver's hand (if Jhabbu Dump occurred), and sets the next leader.
 *
 * In Phase 2, players play from their hand (which contains the cards from their Phase 1 side deck).
 *
 * Key mechanics:
 * - Normal round (no Jhabbu Dump): Cards are discarded, everyone sheds successfully
 * - Jhabbu Dump round: Jhabbu Receiver collects all cards, Jhabbu Giver leads next
 *
 * @param playerId - ID of the player playing the card(s)
 * @param cards - The card(s) being played (multiple for Jhabbu Dump)
 * @param players - Current array of players
 * @param trickCards - Current cards in the round
 * @param currentLeadSuit - Current lead suit (null if round just started)
 * @param expectedPlayerId - ID of the player expected to play (for turn order)
 * @returns Result object with updated game state
 */
export declare function handlePhase2CardPlay(playerId: string, cards: Card[], players: Player[], trickCards: TrickCard[], currentLeadSuit: Suit | null, expectedPlayerId: string): Phase2PlayResult;
/**
 * Result of checking for player elimination
 */
export interface EliminationCheckResult {
    updatedPlayers: Player[];
    eliminatedPlayerIds: string[];
    gameOver: boolean;
    loserId: string | null;
}
/**
 * Checks for player elimination and game end condition.
 * In Phase 2, players with empty hands are eliminated (they won).
 * Game ends when only one player remains with cards in their hand.
 *
 * @param players - Current array of players
 * @returns Result object with updated players and game state
 */
export declare function checkPlayerElimination(players: Player[]): EliminationCheckResult;
/**
 * Handles the complete flow of a round in Phase 2, including elimination checks.
 * This is a convenience function that combines round play and elimination logic.
 *
 * @param playerId - ID of the player playing the card(s)
 * @param cards - The card(s) being played
 * @param players - Current array of players
 * @param trickCards - Current cards in the round
 * @param currentLeadSuit - Current lead suit
 * @param expectedPlayerId - ID of the player expected to play
 * @returns Combined result with round play and elimination check
 */
export declare function handlePhase2TrickWithElimination(playerId: string, cards: Card[], players: Player[], trickCards: TrickCard[], currentLeadSuit: Suit | null, expectedPlayerId: string): Phase2PlayResult & EliminationCheckResult;
/**
 * Prepares players for Phase 2 by moving side deck cards to hand.
 * At the start of Phase 2, each player's side deck becomes their hand.
 * Players with empty side decks (no penalties in Phase 1) start with empty hands
 * and are immediately winners.
 *
 * @param players - Array of players at end of Phase 1
 * @returns Updated players with side deck moved to hand
 */
export declare function transitionToPhase2(players: Player[]): Player[];
//# sourceMappingURL=phase2Logic.d.ts.map