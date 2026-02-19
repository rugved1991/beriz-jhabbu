/**
 * Utility functions for deck management
 */
import { Card } from '../types';
/**
 * Calculates the number of decks needed based on player count
 * Formula: ceiling(N / 4)
 * @param playerCount - Number of players (must be between 2 and 16)
 * @returns Number of decks required
 */
export declare function calculateDeckCount(playerCount: number): number;
/**
 * Validates that player count is within acceptable range
 * @param playerCount - Number of players to validate
 * @returns true if player count is between 2 and 16 inclusive
 */
export declare function isValidPlayerCount(playerCount: number): boolean;
/**
 * Generates a complete card pool with the specified number of decks
 * @param deckCount - Number of standard 52-card decks to generate
 * @returns Shuffled array of cards
 */
export declare function generateDecks(deckCount: number): Card[];
/**
 * Deals cards to players in round-robin order
 * Distributes all cards from the deck to players, with some players potentially
 * receiving one more card than others if cards don't divide evenly
 *
 * @param deck - Array of cards to deal (will be emptied)
 * @param playerCount - Number of players to deal to
 * @returns Array of card arrays, one for each player
 */
export declare function dealCards(deck: Card[], playerCount: number): Card[][];
//# sourceMappingURL=deckUtils.d.ts.map