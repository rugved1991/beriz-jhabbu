/**
 * Helper functions for smart Jhabbu play
 */

import { Card, Rank } from '../types';

/**
 * Get the rank value for comparison.
 * Ace = 14 (highest), King = 13, Queen = 12, Jack = 11, 10 = 10, ..., 2 = 2
 */
function getRankValue(rank: Rank): number {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank, 10);
}

/**
 * Find the lowest card from a set of cards.
 * 
 * @param cards - Array of cards to search
 * @returns The card with the lowest rank
 */
export function findLowestCard(cards: Card[]): Card {
  if (cards.length === 0) {
    throw new Error('Cannot find lowest card from empty array');
  }

  let lowestCard = cards[0];
  let lowestValue = getRankValue(lowestCard.rank);

  for (let i = 1; i < cards.length; i++) {
    const currentValue = getRankValue(cards[i].rank);
    if (currentValue < lowestValue) {
      lowestCard = cards[i];
      lowestValue = currentValue;
    }
  }

  return lowestCard;
}

/**
 * Process a Jhabbu play by separating the lowest card from the rest.
 * Returns the cards to give as Jhabbu (all except lowest) and the lowest card to keep.
 * 
 * @param selectedCards - Array of cards selected by the player
 * @returns Object with jhabbuCards (to give away) and lowestCard (to keep for next round)
 */
export function processJhabbuPlay(selectedCards: Card[]): {
  jhabbuCards: Card[];
  lowestCard: Card;
} {
  if (selectedCards.length < 2) {
    throw new Error('Need at least 2 cards to give Jhabbu');
  }

  const lowestCard = findLowestCard(selectedCards);
  const jhabbuCards = selectedCards.filter(c => c.id !== lowestCard.id);

  return {
    jhabbuCards,
    lowestCard
  };
}
