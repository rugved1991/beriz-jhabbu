import { Card } from '../types';
/**
 * Get the numeric value of a card for penalty calculations.
 * Ace = 1, 2-10 = face value, Face cards (J, Q, K) = null
 *
 * @param card - The card to get the value for
 * @returns The numeric value or null for face cards
 */
export declare function getCardValue(card: Card): number | null;
/**
 * Check if a card's rank already exists on the table (duplicate rank penalty).
 *
 * @param playedCard - The card being played
 * @param tableCards - The cards currently on the table
 * @returns true if the rank exists on the table, false otherwise
 */
export declare function hasDuplicateRank(playedCard: Card, tableCards: Card[]): boolean;
/**
 * Find all subset combinations of cards that sum to the target value.
 * Uses optimized dynamic programming with early termination and space optimization.
 *
 * @param cards - The cards to consider for subset sums
 * @param target - The target sum value
 * @returns Array of all card combinations that sum to the target
 */
export declare function findSubsetSum(cards: Card[], target: number): Card[][];
/**
 * Get the longest combination from an array of card combinations.
 *
 * @param combinations - Array of card combinations
 * @returns The combination with the most cards, or empty array if no combinations
 */
export declare function getLongestCombination(combinations: Card[][]): Card[];
/**
 * Check if a played card triggers a Beriz penalty and return the cards to be picked up.
 * Checks for:
 * 1. Duplicate rank penalty (applies to all cards)
 * 2. Subset sum penalty (applies only to numbered cards, not face cards)
 *
 * When both penalties apply, returns the one with the most cards.
 *
 * @param playedCard - The card being played
 * @param tableCards - The cards currently on the table
 * @returns Array of cards to be picked up (including the played card), or null if no penalty
 */
export declare function checkPenalty(playedCard: Card, tableCards: Card[]): Card[] | null;
//# sourceMappingURL=penaltyEngine.d.ts.map