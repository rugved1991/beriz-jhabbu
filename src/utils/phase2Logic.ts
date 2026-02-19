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
import {
  designateLeadSuit,
  validateSuitFollowing,
  determineTrickWinner,
  validateJhabbu
} from './trickEngine';

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
  trickWinnerId?: string; // Jhabbu Receiver (if Jhabbu Dump occurred)
  nextLeaderId?: string;
  wasJhabbu?: boolean; // Whether this trick involved a Jhabbu dump
  jhabbuCardCount?: number; // Number of cards in the Jhabbu dump
  jhabbuGiverId?: string; // ID of the player who gave Jhabbu
  keptCardId?: string; // ID of the lowest card kept by Jhabbu giver (for auto-play)
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
export function handlePhase2CardPlay(
  playerId: string,
  cards: Card[],
  players: Player[],
  trickCards: TrickCard[],
  currentLeadSuit: Suit | null,
  expectedPlayerId: string
): Phase2PlayResult {
  // Validate it's the correct player's turn
  if (playerId !== expectedPlayerId) {
    return {
      success: false,
      error: 'Not your turn',
      updatedPlayers: players,
      updatedTrickCards: trickCards,
      leadSuit: currentLeadSuit,
      trickComplete: false
    };
  }

  // Find the player
  const playerIndex = players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return {
      success: false,
      error: 'Player not found',
      updatedPlayers: players,
      updatedTrickCards: trickCards,
      leadSuit: currentLeadSuit,
      trickComplete: false
    };
  }

  const player = players[playerIndex];

  // Validate that all cards are in the player's hand
  const cardIds = new Set(cards.map(c => c.id));
  const allCardsInHand = cards.every(card => 
    player.hand.some(c => c.id === card.id)
  );

  if (!allCardsInHand) {
    return {
      success: false,
      error: 'Cards not in player hand',
      updatedPlayers: players,
      updatedTrickCards: trickCards,
      leadSuit: currentLeadSuit,
      trickComplete: false
    };
  }

  // Determine or validate lead suit
  let leadSuit: Suit;
  if (trickCards.length === 0) {
    // First card of the trick - designate lead suit
    leadSuit = designateLeadSuit(cards[0]);
  } else {
    // Not first card - use existing lead suit
    leadSuit = currentLeadSuit!;
  }

  // Validate the play
  if (cards.length === 1) {
    // Single card play - could be normal play OR single-card Jhabbu
    // First check if it's a valid single-card Jhabbu scenario
    const isVoid = !player.hand.some(c => c.suit === leadSuit);
    
    if (isVoid && cards[0].suit !== leadSuit) {
      // Player is void and playing a card not of lead suit
      // Check if this is a valid single-card Jhabbu (only one card of this suit)
      const cardsOfPlayedSuit = player.hand.filter(c => c.suit === cards[0].suit);
      
      if (cardsOfPlayedSuit.length > 1) {
        // Player has multiple cards of this suit but is trying to play just one
        // This is invalid - must play all cards of that suit (minus lowest) for Jhabbu
        console.log('Phase 2 Card Play Failed:', {
          playerId,
          playerName: player.name,
          playedCard: `${cards[0].rank}${cards[0].suit}`,
          leadSuit,
          cardsOfSameSuit: cardsOfPlayedSuit.map(c => `${c.rank}${c.suit}`),
          error: 'Must give Jhabbu with all cards of this suit (not just one)'
        });
        return {
          success: false,
          error: 'Must give Jhabbu with all cards of this suit',
          updatedPlayers: players,
          updatedTrickCards: trickCards,
          leadSuit: currentLeadSuit,
          trickComplete: false
        };
      }
      // Valid single-card Jhabbu - player has only one card of this suit
      console.log('Single-card Jhabbu detected:', {
        playerId,
        playerName: player.name,
        playedCard: `${cards[0].rank}${cards[0].suit}`,
        leadSuit,
        hand: player.hand.map(c => `${c.rank}${c.suit}`)
      });
    } else {
      // Normal single card play - validate suit following
      if (!validateSuitFollowing(cards[0], player.hand, leadSuit)) {
        console.log('Phase 2 Card Play Failed:', {
          playerId,
          playerName: player.name,
          playedCard: `${cards[0].rank}${cards[0].suit}`,
          leadSuit,
          hand: player.hand.map(c => `${c.rank}${c.suit}`),
          error: 'Must follow suit'
        });
        return {
          success: false,
          error: 'Must follow suit',
          updatedPlayers: players,
          updatedTrickCards: trickCards,
          leadSuit: currentLeadSuit,
          trickComplete: false
        };
      }
    }
  } else {
    // Multiple cards - must be a Jhabbu
    if (!validateJhabbu(cards, player.hand, leadSuit)) {
      console.log('Phase 2 Jhabbu Play Failed:', {
        playerId,
        playerName: player.name,
        playedCards: cards.map(c => `${c.rank}${c.suit}`),
        leadSuit,
        hand: player.hand.map(c => `${c.rank}${c.suit}`),
        error: 'Invalid Jhabbu play'
      });
      return {
        success: false,
        error: 'Invalid Jhabbu play',
        updatedPlayers: players,
        updatedTrickCards: trickCards,
        leadSuit: currentLeadSuit,
        trickComplete: false
      };
    }
  }

  // Determine if this is a Jhabbu play (single-card or multi-card)
  const isJhabbuPlay = cards.length > 1 || (cards.length === 1 && cards[0].suit !== leadSuit);
  
  // For multi-card Jhabbu, keep the lowest card
  // For single-card Jhabbu, play the card (it's the only one of that suit)
  let cardsToActuallyPlay: Card[];
  let lowestKeptCard: Card | null = null;
  
  if (isJhabbuPlay && cards.length > 1) {
    // Multi-card Jhabbu - find and keep the lowest card
    const getRankValue = (rank: string): number => {
      if (rank === 'A') return 14;
      if (rank === 'K') return 13;
      if (rank === 'Q') return 12;
      if (rank === 'J') return 11;
      return parseInt(rank, 10);
    };
    
    lowestKeptCard = cards.reduce((lowest, current) => 
      getRankValue(current.rank) < getRankValue(lowest.rank) ? current : lowest
    );
    
    cardsToActuallyPlay = cards.filter(c => c.id !== lowestKeptCard!.id);
    
    console.log('Multi-card Jhabbu: Keeping lowest card', {
      allCards: cards.map(c => `${c.rank}${c.suit}`),
      keptCard: `${lowestKeptCard.rank}${lowestKeptCard.suit}`,
      playedCards: cardsToActuallyPlay.map(c => `${c.rank}${c.suit}`)
    });
  } else if (isJhabbuPlay && cards.length === 1) {
    // Single-card Jhabbu - play the card (it's the only one of that suit)
    // Player keeps the card in hand (doesn't actually give it away)
    // The card acts as the Jhabbu marker but stays with the player
    cardsToActuallyPlay = cards;
    console.log('Single-card Jhabbu: Playing single card of suit', {
      playedCard: `${cards[0].rank}${cards[0].suit}`,
      note: 'Player has only one card of this suit'
    });
  } else {
    // Normal play (not Jhabbu)
    cardsToActuallyPlay = cards;
  }

  // Remove only the cards being played from player's hand (keep the lowest if Jhabbu)
  const playedCardIds = new Set(cardsToActuallyPlay.map(c => c.id));
  const updatedPlayers = players.map((p, idx) => {
    if (idx !== playerIndex) {
      return p;
    }

    return {
      ...p,
      hand: p.hand.filter(c => !playedCardIds.has(c.id))
    };
  });

  // Add only the played cards to trick (not the kept lowest card)
  const updatedTrickCards: TrickCard[] = [
    ...trickCards,
    ...cardsToActuallyPlay.map(card => ({ card, playerId }))
  ];

  // Check if a Jhabbu was just played (any card in the cards actually played not of lead suit)
  const jhabbuJustPlayed = cardsToActuallyPlay.some(card => card.suit !== leadSuit);
  
  // Check if trick is complete
  // Trick completes when: all active players have played OR a Jhabbu was played
  const activePlayers = players.filter(p => p.isActive);
  const playersWhoPlayed = new Set(updatedTrickCards.map(tc => tc.playerId));
  const allPlayersPlayed = playersWhoPlayed.size === activePlayers.length;
  const trickComplete = allPlayersPlayed || jhabbuJustPlayed;

  // Debug logging
  console.log('Phase 2 Card Play:', {
    playerId,
    playerName: player.name,
    playedCards: cards.map(c => `${c.rank}${c.suit}`),
    isFirstCard: trickCards.length === 0,
    leadSuit,
    jhabbuJustPlayed,
    trickCards: updatedTrickCards.map(tc => ({
      player: players.find(p => p.id === tc.playerId)?.name,
      card: `${tc.card.rank}${tc.card.suit}`
    })),
    trickComplete,
    activePlayers: activePlayers.length,
    playersWhoPlayed: playersWhoPlayed.size
  });

  if (!trickComplete) {
    // Round not complete yet
    return {
      success: true,
      updatedPlayers,
      updatedTrickCards,
      leadSuit,
      trickComplete: false
    };
  }  // Round is complete - determine Jhabbu Receiver (player with highest card of lead suit)
  const trickWinnerId = determineTrickWinner(updatedTrickCards, leadSuit);
  const trickWinnerName = players.find(p => p.id === trickWinnerId)?.name;

  // Check if any player played a Jhabbu Dump (cards not of lead suit)
  const jhabbuPlayerId = updatedTrickCards.find(tc => tc.card.suit !== leadSuit)?.playerId;
  const jhabbuGiverName = jhabbuPlayerId ? players.find(p => p.id === jhabbuPlayerId)?.name : null;
  
  // Determine next leader and card destination
  let nextLeaderId: string;
  let finalPlayers: Player[];
  
  if (jhabbuPlayerId) {
    // Jhabbu Dump was played - Jhabbu Receiver collects all cards (penalty), Jhabbu Giver leads next
    const allTrickCards = updatedTrickCards.map(tc => tc.card);
    
    // Count how many cards were in the Jhabbu (cards not of lead suit)
    const jhabbuCardCount = updatedTrickCards.filter(tc => tc.playerId === jhabbuPlayerId).length;
    
    finalPlayers = updatedPlayers.map(p => {
      if (p.id === trickWinnerId) {
        // Jhabbu Receiver gets all cards
        return {
          ...p,
          hand: [...p.hand, ...allTrickCards]
        };
      } else if (p.id === jhabbuPlayerId && p.hand.length === 0) {
        // Jhabbu giver emptied their hand - mark as inactive (eliminated/won)
        return {
          ...p,
          isActive: false
        };
      }
      return p;
    });

    // Check if Jhabbu giver still has cards (they kept the lowest card)
    const jhabbuGiverPlayer = finalPlayers.find(p => p.id === jhabbuPlayerId);
    if (jhabbuGiverPlayer && jhabbuGiverPlayer.isActive && jhabbuGiverPlayer.hand.length > 0) {
      // Jhabbu Giver leads next (they have cards)
      nextLeaderId = jhabbuPlayerId;
    } else {
      // Jhabbu giver is out - find next active player clockwise from Jhabbu giver
      const jhabbuGiverIndex = players.findIndex(p => p.id === jhabbuPlayerId);
      let nextActiveIndex = (jhabbuGiverIndex + 1) % players.length;
      
      while (!finalPlayers[nextActiveIndex].isActive || finalPlayers[nextActiveIndex].hand.length === 0) {
        nextActiveIndex = (nextActiveIndex + 1) % players.length;
      }
      
      nextLeaderId = finalPlayers[nextActiveIndex].id;
    }

    console.log('Phase 2 Trick Complete - JHABBU DUMP:', {
      jhabbuGiver: jhabbuGiverName,
      jhabbuGiverEliminated: finalPlayers.find(p => p.id === jhabbuPlayerId)?.isActive === false,
      jhabbuReceiver: trickWinnerName,
      cardsCollected: allTrickCards.map(c => `${c.rank}${c.suit}`),
      jhabbuCardCount,
      nextLeader: finalPlayers.find(p => p.id === nextLeaderId)?.name,
      jhabbuReceiverNewHandSize: finalPlayers.find(p => p.id === trickWinnerId)?.hand.length
    });
    
    return {
      success: true,
      updatedPlayers: finalPlayers,
      updatedTrickCards: [], // Clear trick cards
      leadSuit, // Return the lead suit that was used
      trickComplete: true,
      trickWinnerId,
      nextLeaderId,
      wasJhabbu: true,
      jhabbuCardCount,
      jhabbuGiverId: jhabbuPlayerId,
      keptCardId: lowestKeptCard?.id // Include the kept card ID for auto-play
    };
  } else {
    // No Jhabbu Dump - cards are discarded, player with highest card leads next
    nextLeaderId = trickWinnerId;
    finalPlayers = updatedPlayers; // No cards added back to anyone

    // Check if the trick winner has no cards left (just emptied their hand)
    const trickWinnerPlayer = finalPlayers.find(p => p.id === trickWinnerId);
    if (trickWinnerPlayer && trickWinnerPlayer.hand.length === 0) {
      // Trick winner emptied their hand - find next active player clockwise
      const trickWinnerIndex = players.findIndex(p => p.id === trickWinnerId);
      let nextActiveIndex = (trickWinnerIndex + 1) % players.length;
      
      // Find next active player
      while (!finalPlayers[nextActiveIndex].isActive || finalPlayers[nextActiveIndex].hand.length === 0) {
        nextActiveIndex = (nextActiveIndex + 1) % players.length;
      }
      
      nextLeaderId = finalPlayers[nextActiveIndex].id;
      
      console.log('Phase 2 Trick Complete - NORMAL (winner emptied hand):', {
        trickWinner: trickWinnerName,
        cardsDiscarded: updatedTrickCards.map(tc => `${tc.card.rank}${tc.card.suit}`),
        nextLeader: finalPlayers[nextActiveIndex].name,
        reason: 'Trick winner emptied hand, next active player leads'
      });
    } else {
      console.log('Phase 2 Trick Complete - NORMAL:', {
        trickWinner: trickWinnerName,
        cardsDiscarded: updatedTrickCards.map(tc => `${tc.card.rank}${tc.card.suit}`),
        nextLeader: trickWinnerName
      });
    }
  }

  return {
    success: true,
    updatedPlayers: finalPlayers,
    updatedTrickCards: [], // Clear trick cards
    leadSuit, // Return the lead suit that was used
    trickComplete: true,
    trickWinnerId,
    nextLeaderId,
    wasJhabbu: false
  };
}


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
export function checkPlayerElimination(players: Player[]): EliminationCheckResult {
  const eliminatedPlayerIds: string[] = [];

  // Count how many players have already finished (have finishPosition set)
  const finishedCount = players.filter(p => p.finishPosition !== undefined).length;

  // Mark players with empty hands as inactive (they've won)
  const updatedPlayers = players.map(player => {
    if (player.isActive && player.hand.length === 0) {
      eliminatedPlayerIds.push(player.id);
      return {
        ...player,
        isActive: false,
        finishPosition: finishedCount + eliminatedPlayerIds.indexOf(player.id) + 1 // Assign finish position
      };
    }
    return player;
  });

  // Count remaining active players with cards in hand
  const activePlayers = updatedPlayers.filter(p => p.isActive && p.hand.length > 0);

  // Game is over if only one player remains with cards
  const gameOver = activePlayers.length === 1;
  const loserId = gameOver ? activePlayers[0].id : null;

  return {
    updatedPlayers,
    eliminatedPlayerIds,
    gameOver,
    loserId
  };
}

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
export function handlePhase2TrickWithElimination(
  playerId: string,
  cards: Card[],
  players: Player[],
  trickCards: TrickCard[],
  currentLeadSuit: Suit | null,
  expectedPlayerId: string
): Phase2PlayResult & EliminationCheckResult {
  // Handle the round play
  const playResult = handlePhase2CardPlay(
    playerId,
    cards,
    players,
    trickCards,
    currentLeadSuit,
    expectedPlayerId
  );

  if (!playResult.success || !playResult.trickComplete) {
    // If play failed or round not complete, return with no elimination
    return {
      ...playResult,
      eliminatedPlayerIds: [],
      gameOver: false,
      loserId: null
    };
  }

  // Check for player elimination after round completes
  const eliminationResult = checkPlayerElimination(playResult.updatedPlayers);

  if (eliminationResult.eliminatedPlayerIds.length > 0) {
    console.log('Phase 2 Player Elimination:', {
      eliminatedPlayers: eliminationResult.eliminatedPlayerIds.map(id => 
        playResult.updatedPlayers.find(p => p.id === id)?.name
      ),
      remainingActivePlayers: eliminationResult.updatedPlayers
        .filter(p => p.isActive)
        .map(p => ({ name: p.name, handSize: p.hand.length })),
      gameOver: eliminationResult.gameOver,
      loser: eliminationResult.loserId ? 
        eliminationResult.updatedPlayers.find(p => p.id === eliminationResult.loserId)?.name : 
        null
    });
  }

  return {
    ...playResult,
    updatedPlayers: eliminationResult.updatedPlayers,
    eliminatedPlayerIds: eliminationResult.eliminatedPlayerIds,
    gameOver: eliminationResult.gameOver,
    loserId: eliminationResult.loserId
  };
}

/**
 * Prepares players for Phase 2 by moving side deck cards to hand.
 * At the start of Phase 2, each player's side deck becomes their hand.
 * Players with empty side decks (no penalties in Phase 1) start with empty hands
 * and are immediately winners.
 * 
 * @param players - Array of players at end of Phase 1
 * @returns Updated players with side deck moved to hand
 */
export function transitionToPhase2(players: Player[]): Player[] {
  const phase2Players = players.map(player => ({
    ...player,
    hand: [...player.sideDeck],
    sideDeck: [],
    // Players with no cards are already winners (inactive)
    isActive: player.sideDeck.length > 0
  }));

  console.log('Phase 2 Transition:', {
    players: phase2Players.map(p => ({
      name: p.name,
      handSize: p.hand.length,
      isActive: p.isActive,
      hand: p.hand.map(c => `${c.rank}${c.suit}`)
    }))
  });

  return phase2Players;
}
