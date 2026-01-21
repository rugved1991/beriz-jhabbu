/**
 * Utility functions for sorting cards
 */

import { Card, Suit, Rank } from '../types';

/**
 * Suit order for sorting (standard bridge order)
 */
const SUIT_ORDER: Record<Suit, number> = {
  'clubs': 0,
  'diamonds': 1,
  'hearts': 2,
  'spades': 3
};

/**
 * Rank order for sorting (Ace low to King high)
 */
const RANK_ORDER: Record<Rank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13
};

/**
 * Sorts cards by suit first, then by rank within each suit.
 * Suits are ordered: Clubs, Diamonds, Hearts, Spades
 * Ranks are ordered: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
 * 
 * @param cards - Array of cards to sort
 * @returns New sorted array of cards
 */
export function sortCardsBySuitAndRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // First compare by suit
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (suitDiff !== 0) {
      return suitDiff;
    }
    
    // If same suit, compare by rank
    return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
  });
}
