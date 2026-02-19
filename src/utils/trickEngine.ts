import { Card, Suit, TrickCard } from '../types';

/**
 * Designate the lead suit from the first card played in a trick.
 * 
 * @param firstCard - The first card played in the trick
 * @returns The suit of the first card, which becomes the lead suit
 */
export function designateLeadSuit(firstCard: Card): Suit {
  return firstCard.suit;
}

/**
 * Check if a player has any cards of the specified suit in their hand.
 * 
 * @param hand - The player's hand of cards
 * @param suit - The suit to check for
 * @returns true if the player has at least one card of the suit, false otherwise
 */
export function hasCardsOfSuit(hand: Card[], suit: Suit): boolean {
  return hand.some(card => card.suit === suit);
}

/**
 * Validate if a card play follows suit rules.
 * If the player has cards of the lead suit, they must play a card of that suit.
 * 
 * @param cardToPlay - The card the player wants to play
 * @param hand - The player's current hand
 * @param leadSuit - The lead suit for this trick
 * @returns true if the play is valid, false otherwise
 */
export function validateSuitFollowing(cardToPlay: Card, hand: Card[], leadSuit: Suit): boolean {
  // If the player has cards of the lead suit
  if (hasCardsOfSuit(hand, leadSuit)) {
    // They must play a card of the lead suit
    return cardToPlay.suit === leadSuit;
  }
  
  // If the player doesn't have cards of the lead suit, they can play any card
  return true;
}

/**
 * Get the rank value for trick winner determination.
 * Ace = 14 (highest), King = 13, Queen = 12, Jack = 11, 10 = 10, ..., 2 = 2
 * 
 * @param rank - The card rank
 * @returns The numeric value for comparison
 */
function getRankValue(rank: string): number {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank, 10);
}

/**
 * Determine the winner of a trick.
 * The winner is the player who played the highest card of the lead suit.
 * Jhabbu cards (cards not of the lead suit) are ignored for winner determination.
 * 
 * @param trickCards - Array of cards played in the trick with player IDs
 * @param leadSuit - The lead suit for this trick
 * @returns The player ID of the trick winner
 */
export function determineTrickWinner(trickCards: TrickCard[], leadSuit: Suit): string {
  // Filter to only cards of the lead suit (ignore Jhabbu cards)
  const leadSuitCards = trickCards.filter(tc => tc.card.suit === leadSuit);
  
  // Find the highest card of the lead suit
  let winningCard = leadSuitCards[0];
  
  for (let i = 1; i < leadSuitCards.length; i++) {
    const currentCard = leadSuitCards[i];
    if (getRankValue(currentCard.card.rank) > getRankValue(winningCard.card.rank)) {
      winningCard = currentCard;
    }
  }
  
  return winningCard.playerId;
}

/**
 * Check if a player is void in the lead suit (has no cards of that suit).
 * 
 * @param hand - The player's hand of cards
 * @param leadSuit - The lead suit to check
 * @returns true if the player has no cards of the lead suit, false otherwise
 */
export function isVoidInSuit(hand: Card[], leadSuit: Suit): boolean {
  return !hasCardsOfSuit(hand, leadSuit);
}

/**
 * Get the lowest card of a specific suit from a hand.
 * 
 * @param hand - The player's hand of cards
 * @param suit - The suit to find the lowest card of
 * @returns The lowest card of the specified suit, or null if no cards of that suit
 */
function getLowestCardOfSuit(hand: Card[], suit: Suit): Card | null {
  const cardsOfSuit = hand.filter(card => card.suit === suit);
  
  if (cardsOfSuit.length === 0) {
    return null;
  }
  
  return cardsOfSuit.reduce((lowest, current) => 
    getRankValue(current.rank) < getRankValue(lowest.rank) ? current : lowest
  );
}

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
export function getValidJhabbuCards(hand: Card[], leadSuit: Suit, chosenSuit: Suit): Card[] | null {
  // Player must be void in lead suit
  if (!isVoidInSuit(hand, leadSuit)) {
    return null;
  }
  
  // Cannot choose the lead suit for Jhabbu
  if (chosenSuit === leadSuit) {
    return null;
  }
  
  // Get all cards of the chosen suit
  const cardsOfChosenSuit = hand.filter(card => card.suit === chosenSuit);
  
  if (cardsOfChosenSuit.length === 0) {
    return null;
  }
  
  // Check if player only has single cards of other suits (single-card Jhabbu exception)
  const suitCounts = new Map<Suit, number>();
  for (const card of hand) {
    if (card.suit !== leadSuit) {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }
  }
  
  const allSingleCards = Array.from(suitCounts.values()).every(count => count === 1);
  
  if (allSingleCards) {
    // Single-card Jhabbu: can play one card of any suit
    return [cardsOfChosenSuit[0]];
  }
  
  // Normal Jhabbu: can play all cards of chosen suit except the lowest
  if (cardsOfChosenSuit.length === 1) {
    // Cannot Jhabbu with only one card of the suit (must retain lowest)
    return null;
  }
  
  const lowestCard = getLowestCardOfSuit(hand, chosenSuit);
  
  if (!lowestCard) {
    return null;
  }
  
  // Return all cards except the lowest
  return cardsOfChosenSuit.filter(card => card.id !== lowestCard.id);
}

/**
 * Validate if a Jhabbu play is legal.
 * Client sends ALL cards of the suit they want to Jhabbu with.
 * Server validates and will keep the lowest card for the player (for multi-card Jhabbu).
 * 
 * Single-card Jhabbu: When player has only one card of a suit, they can give Jhabbu with just that card.
 * 
 * @param cardsToPlay - ALL cards the player selected (including lowest for multi-card)
 * @param hand - The player's current hand
 * @param leadSuit - The lead suit for this trick
 * @returns true if the Jhabbu is valid, false otherwise
 */
export function validateJhabbu(cardsToPlay: Card[], hand: Card[], leadSuit: Suit): boolean {
  if (cardsToPlay.length === 0) {
    return false;
  }
  
  // All cards must be of the same suit
  const jhabbuSuit = cardsToPlay[0].suit;
  if (!cardsToPlay.every(card => card.suit === jhabbuSuit)) {
    return false;
  }
  
  // Player must be void in lead suit
  if (!isVoidInSuit(hand, leadSuit)) {
    return false;
  }
  
  // Cannot choose the lead suit for Jhabbu
  if (jhabbuSuit === leadSuit) {
    return false;
  }
  
  // Get all cards of the chosen suit from hand
  const cardsOfChosenSuit = hand.filter(card => card.suit === jhabbuSuit);
  
  if (cardsOfChosenSuit.length === 0) {
    return false;
  }
  
  // Single-card Jhabbu: Player has only one card of this suit
  if (cardsOfChosenSuit.length === 1) {
    return cardsToPlay.length === 1 && cardsToPlay[0].suit === jhabbuSuit;
  }
  
  // Multi-card Jhabbu: must play at least 2 cards of the same suit
  if (cardsToPlay.length < 2) {
    return false;
  }
  
  // Verify all cards to play are in the hand and of the chosen suit
  const cardIds = new Set(cardsToPlay.map(c => c.id));
  return cardsToPlay.every(card => 
    cardsOfChosenSuit.some(c => c.id === card.id)
  );
}
