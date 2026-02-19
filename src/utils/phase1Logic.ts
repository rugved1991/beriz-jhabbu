/**
 * Phase 1 (Beriz) game logic
 * Handles card play, penalty detection, and phase completion
 */

import { Card, Player } from '../types';
import { checkPenalty } from './penaltyEngine';

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
export function handlePhase1CardPlay(
  playerId: string,
  card: Card,
  players: Player[],
  table: Card[]
): Phase1PlayResult {
  // Find the player
  const playerIndex = players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return {
      success: false,
      error: 'Player not found',
      updatedPlayers: players,
      updatedTable: table,
      phase1Complete: false
    };
  }

  const player = players[playerIndex];

  // Validate that the card is in the player's hand
  const cardIndex = player.hand.findIndex(c => c.id === card.id);
  if (cardIndex === -1) {
    return {
      success: false,
      error: 'Card not in player hand',
      updatedPlayers: players,
      updatedTable: table,
      phase1Complete: false
    };
  }

  // Check for penalties
  const penaltyCards = checkPenalty(card, table);

  // Debug logging
  console.log('Phase 1 Card Play Debug:', {
    playedCard: `${card.rank}${card.suit}`,
    tableCards: table.map(c => `${c.rank}${c.suit}`),
    penaltyDetected: penaltyCards !== null,
    penaltyCards: penaltyCards?.map(c => `${c.rank}${c.suit}`)
  });

  // Create updated players array
  const updatedPlayers = players.map((p, idx) => {
    if (idx !== playerIndex) {
      return p;
    }

    // Remove the played card from hand
    const newHand = p.hand.filter(c => c.id !== card.id);

    if (penaltyCards) {
      // Penalty occurred - add penalty cards to side deck
      return {
        ...p,
        hand: newHand,
        sideDeck: [...p.sideDeck, ...penaltyCards]
      };
    } else {
      // No penalty - just remove card from hand
      return {
        ...p,
        hand: newHand
      };
    }
  });

  // Update table
  let updatedTable: Card[];
  if (penaltyCards) {
    // Remove penalty cards from table (all except the played card)
    const penaltyCardIds = new Set(penaltyCards.map(c => c.id));
    updatedTable = table.filter(c => !penaltyCardIds.has(c.id));
  } else {
    // No penalty - add card to table
    updatedTable = [...table, card];
  }

  // Check if Phase 1 is complete
  const phase1Complete = checkPhase1Completion(updatedPlayers);

  // Debug logging for phase completion
  if (phase1Complete) {
    console.log('Phase 1 Complete Check:', {
      allPlayersHandSizes: updatedPlayers.map(p => ({ name: p.name, handSize: p.hand.length }))
    });
  }

  return {
    success: true,
    penaltyCards: penaltyCards || undefined,
    updatedPlayers,
    updatedTable,
    phase1Complete
  };
}

/**
 * Checks if Phase 1 is complete (only one player or no players have cards left).
 * Phase 1 ends when the last player plays their final card.
 * 
 * @param players - Array of players
 * @returns true if one or zero players have cards remaining, false otherwise
 */
export function checkPhase1Completion(players: Player[]): boolean {
  const playersWithCards = players.filter(player => player.hand.length > 0);
  return playersWithCards.length <= 1;
}

/**
 * Handles Phase 1 completion by moving all remaining table cards AND the last player's
 * remaining hand cards to their side deck.
 * 
 * @param lastPlayerId - ID of the last player who played a card
 * @param players - Current array of players
 * @param table - Current cards on the table
 * @returns Updated players array with table cards and last player's hand moved to side deck
 */
export function handlePhase1Completion(
  lastPlayerId: string,
  players: Player[],
  table: Card[]
): Player[] {
  // Find the last player who still has cards (if any)
  const playerWithCards = players.find(p => p.hand.length > 0);
  
  // If no player has cards, just move table cards to last player who played
  if (!playerWithCards) {
    if (table.length === 0) {
      return players;
    }

    const playerIndex = players.findIndex(p => p.id === lastPlayerId);
    if (playerIndex === -1) {
      return players;
    }

    return players.map((p, idx) => {
      if (idx !== playerIndex) {
        return p;
      }

      return {
        ...p,
        sideDeck: [...p.sideDeck, ...table]
      };
    });
  }

  // If a player still has cards, they collect their hand + table cards
  return players.map((p) => {
    if (p.id !== playerWithCards.id) {
      return p;
    }

    console.log('Phase 1 Completion - Last player collects:', {
      playerName: p.name,
      handCards: p.hand.length,
      tableCards: table.length,
      totalCollected: p.hand.length + table.length
    });

    return {
      ...p,
      hand: [], // Empty their hand
      sideDeck: [...p.sideDeck, ...p.hand, ...table] // Add hand + table to side deck
    };
  });
}
