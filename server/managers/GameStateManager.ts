/**
 * Game State Manager
 * Manages game state transitions and validates player moves
 * Reuses existing game logic from src/utils
 * Updated: 2024-12-20 - Fixed Jhabbu validation logic
 */

import { GameState, Card, Player } from '../../src/types';
import { handlePhase1CardPlay, handlePhase1Completion } from '../../src/utils/phase1Logic';
import { handlePhase2TrickWithElimination, transitionToPhase2 } from '../../src/utils/phase2Logic';
import { transitionToPhase } from '../../src/utils/stateMachine';
import { calculateDeckCount, generateDecks, dealCards } from '../../src/utils/deckUtils';

interface CardPlayResult {
  success: boolean;
  newGameState: GameState;
  error?: string;
  event?: string;
}

export class GameStateManager {
  /**
   * Starts a new game by dealing cards and transitioning to BERIZ phase
   * @param gameState - Current game state (should be in LOBBY phase)
   * @returns Updated game state with dealt cards in BERIZ phase
   */
  startGame(gameState: GameState): GameState {
    let newState = transitionToPhase(gameState, 'DEALING');

    // Determine dealer
    let dealerIndex: number;
    if (gameState.dealerId) {
      const currentDealerIndex = gameState.players.findIndex(p => p.id === gameState.dealerId);
      dealerIndex = (currentDealerIndex + 1) % gameState.players.length;
    } else {
      dealerIndex = Math.floor(Math.random() * gameState.players.length);
    }
    
    newState.dealerId = gameState.players[dealerIndex].id;

    // Deal cards
    const deckCount = calculateDeckCount(gameState.players.length);
    const deck = generateDecks(deckCount);
    const hands = dealCards(deck, gameState.players.length);

    newState.players = gameState.players.map((player, index) => ({
      ...player,
      hand: hands[index],
      sideDeck: [],
      isActive: true,
      finishPosition: undefined
    }));

    // Transition to BERIZ
    newState = transitionToPhase(newState, 'BERIZ');
    newState.currentPlayerIndex = (dealerIndex + 1) % gameState.players.length;

    return newState;
  }

  /**
   * Processes a card play by routing to Phase 1 or Phase 2 logic
   * @param gameState - Current game state
   * @param playerId - ID of the player playing the card(s)
   * @param cards - Card(s) being played
   * @returns Result with success status, updated game state, and optional error/event
   */
  processCardPlay(gameState: GameState, playerId: string, cards: Card[]): CardPlayResult {
    // Verify it's the player's turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { 
        success: false, 
        newGameState: gameState, 
        error: 'Not your turn' 
      };
    }

    if (gameState.phase === 'BERIZ') {
      return this.processPhase1Play(gameState, playerId, cards[0]);
    } else if (gameState.phase === 'JHABBU') {
      return this.processPhase2Play(gameState, playerId, cards);
    }

    return { 
      success: false, 
      newGameState: gameState, 
      error: 'Invalid game phase' 
    };
  }

  /**
   * Processes a Phase 1 (BERIZ) card play
   * @param gameState - Current game state
   * @param playerId - ID of the player playing the card
   * @param card - Card being played
   * @returns Result with updated game state
   */
  private processPhase1Play(gameState: GameState, playerId: string, card: Card): CardPlayResult {
    const result = handlePhase1CardPlay(
      playerId,
      card,
      gameState.players,
      gameState.table
    );

    if (!result.success) {
      return { 
        success: false, 
        newGameState: gameState, 
        error: result.error 
      };
    }

    let newState: GameState = {
      ...gameState,
      players: result.updatedPlayers,
      table: result.updatedTable
    };

    let event = 'cardPlayed';

    // Check if Phase 1 is complete
    if (result.phase1Complete) {
      const finalPlayers = handlePhase1Completion(
        playerId,
        result.updatedPlayers,
        result.updatedTable
      );

      const phase2Players = transitionToPhase2(finalPlayers);

      newState = {
        ...newState,
        players: phase2Players,
        table: [],
        leadSuit: null,
        trickCards: []
      };

      newState = transitionToPhase(newState, 'JHABBU');
      event = 'phaseTransition';
    }

    // Move to next player
    newState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    return { success: true, newGameState: newState, event };
  }

  /**
   * Processes a Phase 2 (JHABBU) card play
   * @param gameState - Current game state
   * @param playerId - ID of the player playing the card(s)
   * @param cards - Card(s) being played
   * @returns Result with updated game state
   */
  private processPhase2Play(gameState: GameState, playerId: string, cards: Card[]): CardPlayResult {
    const expectedPlayerId = gameState.players[gameState.currentPlayerIndex].id;

    const result = handlePhase2TrickWithElimination(
      playerId,
      cards,
      gameState.players,
      gameState.trickCards,
      gameState.leadSuit,
      expectedPlayerId
    );

    if (!result.success) {
      return { 
        success: false, 
        newGameState: gameState, 
        error: result.error 
      };
    }

    let newState: GameState = {
      ...gameState,
      players: result.updatedPlayers,
      trickCards: result.updatedTrickCards,
      leadSuit: result.leadSuit,
      jhabbuAnnouncement: null // Clear any previous announcement
    };

    let event = 'cardPlayed';

    if (result.trickComplete && result.nextLeaderId) {
      const nextLeaderIndex = newState.players.findIndex(p => p.id === result.nextLeaderId);
      newState.currentPlayerIndex = nextLeaderIndex;
      newState.leadSuit = null;
      
      if (result.wasJhabbu && result.jhabbuGiverId && result.trickWinnerId && result.jhabbuCardCount) {
        // Set Jhabbu announcement data
        newState.jhabbuAnnouncement = {
          jhabbuGiverId: result.jhabbuGiverId,
          jhabbuReceiverId: result.trickWinnerId,
          cardCount: result.jhabbuCardCount,
          keptCardId: result.keptCardId // Include kept card ID for auto-play
        };
        event = 'jhabbuAnnouncement';
      } else {
        event = 'trickComplete';
      }
    } else {
      let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      while (!gameState.players[nextPlayerIndex].isActive) {
        nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      }
      newState.currentPlayerIndex = nextPlayerIndex;
    }

    if (result.gameOver && result.loserId) {
      newState.loser = result.loserId;
      newState = transitionToPhase(newState, 'GAME_OVER');
      event = 'gameOver';
    }

    return { success: true, newGameState: newState, event };
  }
}
