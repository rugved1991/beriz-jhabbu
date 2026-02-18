/**
 * Server-side bot AI for automated gameplay
 * Imported from client-side bot AI logic
 */

import { Card, Player, GameState } from '../../src/types';
import { getCardValue, hasDuplicateRank, findSubsetSum } from '../../src/utils/penaltyEngine';

/**
 * Calculate the sum of numeric cards on the table
 */
function calculateTableSum(tableCards: Card[]): number {
  return tableCards.reduce((sum, card) => {
    const value = getCardValue(card);
    return sum + (value || 0);
  }, 0);
}

/**
 * Check if playing a card would trigger a penalty
 */
function wouldTriggerPenalty(card: Card, tableCards: Card[]): boolean {
  // Check for duplicate rank penalty
  if (hasDuplicateRank(card, tableCards)) {
    return true;
  }

  // Check for sum match penalty
  const cardValue = getCardValue(card);
  if (cardValue !== null && tableCards.length > 0) {
    const tableSum = calculateTableSum(tableCards);
    if (cardValue === tableSum) {
      return true;
    }

    // Check if card value matches any subset sum
    const subsets = findSubsetSum(tableCards, cardValue);
    if (subsets.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Bot AI: Select a card to play in Phase 1 (Beriz)
 * Strategy: Avoid picking up cards from the table
 */
export function botSelectPhase1Card(player: Player, gameState: GameState): Card {
  if (player.hand.length === 0) {
    throw new Error('Bot has no cards to play');
  }
  
  // Try to find a card that won't trigger a penalty
  const safeCards = player.hand.filter(card => !wouldTriggerPenalty(card, gameState.table));
  
  if (safeCards.length > 0) {
    // Play a random safe card
    const randomIndex = Math.floor(Math.random() * safeCards.length);
    return safeCards[randomIndex];
  }
  
  // If no safe cards, play a random card (unavoidable penalty)
  const randomIndex = Math.floor(Math.random() * player.hand.length);
  return player.hand[randomIndex];
}

/**
 * Bot AI: Select card(s) to play in Phase 2 (Jhabbu)
 * Strategy: Follow suit if possible, otherwise play lowest card
 */
export function botSelectPhase2Cards(player: Player, gameState: GameState): Card[] {
  if (player.hand.length === 0) {
    // Player has no cards - they should be inactive
    return [];
  }

  const leadSuit = gameState.leadSuit;

  // If no lead suit yet (first player), play lowest card
  if (!leadSuit) {
    const sortedHand = [...player.hand].sort((a, b) => {
      const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    });
    return [sortedHand[0]];
  }

  // Check if bot has cards of lead suit
  const leadSuitCards = player.hand.filter(card => card.suit === leadSuit);

  if (leadSuitCards.length > 0) {
    // Follow suit - play lowest card
    const sortedLeadCards = [...leadSuitCards].sort((a, b) => {
      const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    });
    return [sortedLeadCards[0]];
  }

  // Bot is void in lead suit - give Jhabbu with as many cards as possible
  // Strategy: Find the suit with the most cards and give all of them as Jhabbu
  const sortedHand = [...player.hand].sort((a, b) => {
    const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });
  
  // If bot only has 1 card left, they must play it (will be eliminated)
  if (player.hand.length === 1) {
    return [sortedHand[0]];
  }
  
  // Find the suit with the most cards (to maximize Jhabbu dump)
  const suitCounts = new Map<string, Card[]>();
  player.hand.forEach(card => {
    if (!suitCounts.has(card.suit)) {
      suitCounts.set(card.suit, []);
    }
    suitCounts.get(card.suit)!.push(card);
  });
  
  // Find suit with maximum cards
  let maxSuit: string | null = null;
  let maxCount = 0;
  suitCounts.forEach((cards, suit) => {
    if (cards.length > maxCount) {
      maxCount = cards.length;
      maxSuit = suit;
    }
  });
  
  // Check if all non-lead-suit cards are singles (edge case: single-card Jhabbu)
  const allSingleCards = Array.from(suitCounts.values()).every(cards => cards.length === 1);
  
  if (allSingleCards && suitCounts.size > 0) {
    // Single-card Jhabbu: play one card of any suit (not lead suit)
    // Choose the highest card to minimize future risk
    const nonLeadCards = player.hand.filter(card => card.suit !== leadSuit);
    const sortedNonLeadCards = nonLeadCards.sort((a, b) => {
      const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    });
    return [sortedNonLeadCards[sortedNonLeadCards.length - 1]];
  }
  
  // If we have multiple cards of one suit, select ALL of them for Jhabbu
  // The system will automatically keep the lowest and give the rest
  if (maxSuit && maxCount >= 2) {
    const jhabbuCards = suitCounts.get(maxSuit)!;
    // Sort by rank and return ALL cards of that suit
    // The game logic will handle keeping the lowest card
    return jhabbuCards.sort((a, b) => {
      const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    });
  }
  
  // Fallback: play single lowest card
  return [sortedHand[0]];
}

/**
 * Check if a player is a bot based on their ID
 */
export function isBot(playerId: string): boolean {
  return playerId.startsWith('bot-');
}

/**
 * Get delay for bot action (to make it feel more natural)
 * Returns a random delay between 1-2 seconds
 */
export function getBotDelay(): number {
  return 1000 + Math.random() * 1000; // 1-2 seconds
}
