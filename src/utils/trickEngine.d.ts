import { Card, Suit, TrickCard } from '../types';
/**
 * Designate the lead suit from the first card played in a trick.
 *
 * @param firstCard - The first card played in the trick
 * @returns The suit of the first card, which becomes the lead suit
 */
export declare function designateLeadSuit(firstCard: Card): Suit;
/**
 * Check if a player has any cards of the specified suit in their hand.
 *
 * @param hand - The player's hand of cards
 * @param suit - The suit to check for
 * @returns true if the player has at least one card of the suit, false otherwise
 */
export declare function hasCardsOfSuit(hand: Card[], suit: Suit): boolean;
/**
 * Validate if a card play follows suit rules.
 * If the player has cards of the lead suit, they must play a card of that suit.
 *
 * @param cardToPlay - The card the player wants to play
 * @param hand - The player's current hand
 * @param leadSuit - The lead suit for this trick
 * @returns true if the play is valid, false otherwise
 */
export declare function validateSuitFollowing(cardToPlay: Card, hand: Card[], leadSuit: Suit): boolean;
/**
 * Determine the winner of a trick.
 * The winner is the player who played the highest card of the lead suit.
 * Jhabbu cards (cards not of the lead suit) are ignored for winner determination.
 *
 * @param trickCards - Array of cards played in the trick with player IDs
 * @param leadSuit - The lead suit for this trick
 * @returns The player ID of the trick winner
 */
export declare function determineTrickWinner(trickCards: TrickCard[], leadSuit: Suit): string;
/**
 * Check if a player is void in the lead suit (has no cards of that suit).
 *
 * @param hand - The player's hand of cards
 * @param leadSuit - The lead suit to check
 * @returns true if the player has no cards of the lead suit, false otherwise
 */
export declare function isVoidInSuit(hand: Card[], leadSuit: Suit): boolean;
/**
 * Get valid Jhabbu cards for a player who is void in the lead suit.
 * A player can play all cards of a chosen suit except the lowest card.
 * Exception: If the player only has single cards of other suits, they can play one card.
 *
 * @param hand - The player's hand of cards
 * @param leadSuit - The lead suit the player is void in
 * @param chosenSuit - The suit the player wants to dump
 * @returns Array of valid Jhabbu cards, or null if the Jhabbu is invalid
 */
export declare function getValidJhabbuCards(hand: Card[], leadSuit: Suit, chosenSuit: Suit): Card[] | null;
/**
 * Validate if a Jhabbu play is legal.
 *
 * @param cardsToPlay - The cards the player wants to play
 * @param hand - The player's current hand
 * @param leadSuit - The lead suit for this trick
 * @returns true if the Jhabbu is valid, false otherwise
 */
export declare function validateJhabbu(cardsToPlay: Card[], hand: Card[], leadSuit: Suit): boolean;
//# sourceMappingURL=trickEngine.d.ts.map