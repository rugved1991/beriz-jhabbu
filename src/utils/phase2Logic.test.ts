/**
 * Tests for Phase 2 (Jhabbu) game logic
 * 
 * In Phase 2, players play from their hand (which contains cards from Phase 1 side deck).
 * The goal is to empty your hand - the last player with cards loses.
 */

import {
  handlePhase2CardPlay,
  checkPlayerElimination,
  handlePhase2TrickWithElimination
} from './phase2Logic';
import { Card, Player, TrickCard } from '../types';

describe('Phase 2 Logic', () => {
  // Helper function to create a test card
  const createCard = (suit: 'hearts' | 'diamonds' | 'clubs' | 'spades', rank: string, id?: string): Card => ({
    suit,
    rank: rank as any,
    id: id || `${suit}-${rank}`
  });

  // Helper function to create a test player
  const createPlayer = (
    id: string,
    name: string,
    hand: Card[],
    sideDeck: Card[] = [],
    isActive: boolean = true
  ): Player => ({
    id,
    name,
    hand,
    sideDeck,
    isActive,
    isHost: false,
    position: 0
  });

  describe('handlePhase2CardPlay', () => {
    it('should handle first card of trick and designate lead suit', () => {
      const card = createCard('hearts', 'A');
      const player = createPlayer('p1', 'Player 1', [card]);
      const players = [player];

      const result = handlePhase2CardPlay(
        'p1',
        [card],
        players,
        [],
        null,
        'p1'
      );

      expect(result.success).toBe(true);
      expect(result.leadSuit).toBe('hearts');
      expect(result.trickComplete).toBe(true); // Only one player
      // When trick is complete, cards are cleared
      expect(result.updatedTrickCards).toHaveLength(0);
      // No Jhabbu - cards discarded, winner has empty hand
      const winner = result.updatedPlayers.find(p => p.id === 'p1');
      expect(winner?.hand).toHaveLength(0);
    });

    it('should validate turn order', () => {
      const card = createCard('hearts', 'A');
      const player1 = createPlayer('p1', 'Player 1', [card]);
      const player2 = createPlayer('p2', 'Player 2', [createCard('hearts', 'K')]);
      const players = [player1, player2];

      const result = handlePhase2CardPlay(
        'p2',
        [card],
        players,
        [],
        null,
        'p1' // Expecting p1 to play
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should validate cards are in player hand', () => {
      const card = createCard('hearts', 'A');
      const player = createPlayer('p1', 'Player 1', []); // Empty hand
      const players = [player];

      const result = handlePhase2CardPlay(
        'p1',
        [card],
        players,
        [],
        null,
        'p1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cards not in player hand');
    });

    it('should complete trick when all players have played', () => {
      const card1 = createCard('hearts', 'A', 'h-a-1');
      const card2 = createCard('hearts', 'K', 'h-k-1');
      const player1 = createPlayer('p1', 'Player 1', [card1]);
      const player2 = createPlayer('p2', 'Player 2', [card2]);
      const players = [player1, player2];

      // First player plays
      const result1 = handlePhase2CardPlay(
        'p1',
        [card1],
        players,
        [],
        null,
        'p1'
      );

      expect(result1.success).toBe(true);
      expect(result1.trickComplete).toBe(false);

      // Second player plays
      const result2 = handlePhase2CardPlay(
        'p2',
        [card2],
        result1.updatedPlayers,
        result1.updatedTrickCards,
        result1.leadSuit,
        'p2'
      );

      expect(result2.success).toBe(true);
      expect(result2.trickComplete).toBe(true);
      expect(result2.trickWinnerId).toBe('p1'); // Ace beats King
      expect(result2.nextLeaderId).toBe('p1');
    });

    it('should move trick cards to winner hand', () => {
      const card1 = createCard('hearts', 'A', 'h-a-1');
      const card2 = createCard('hearts', 'K', 'h-k-1');
      const player1 = createPlayer('p1', 'Player 1', [card1]);
      const player2 = createPlayer('p2', 'Player 2', [card2]);
      const players = [player1, player2];

      // Play both cards
      const result1 = handlePhase2CardPlay('p1', [card1], players, [], null, 'p1');
      const result2 = handlePhase2CardPlay(
        'p2',
        [card2],
        result1.updatedPlayers,
        result1.updatedTrickCards,
        result1.leadSuit,
        'p2'
      );

      // No Jhabbu - cards should be discarded, not added to winner's hand
      const winner = result2.updatedPlayers.find(p => p.id === 'p1');
      expect(winner?.hand).toHaveLength(0); // Both players played their only card
      
      const loser = result2.updatedPlayers.find(p => p.id === 'p2');
      expect(loser?.hand).toHaveLength(0);
    });

    it('should move trick cards to winner hand when Jhabbu is played', () => {
      const card1 = createCard('hearts', 'A', 'h-a-1');
      const card2 = createCard('diamonds', 'K', 'd-k-1'); // Different suit - Jhabbu!
      const player1 = createPlayer('p1', 'Player 1', [card1]);
      const player2 = createPlayer('p2', 'Player 2', [card2]);
      const players = [player1, player2];

      // Play both cards
      const result1 = handlePhase2CardPlay('p1', [card1], players, [], null, 'p1');
      const result2 = handlePhase2CardPlay(
        'p2',
        [card2],
        result1.updatedPlayers,
        result1.updatedTrickCards,
        result1.leadSuit,
        'p2'
      );

      // Jhabbu was played - winner (p1) should collect all cards
      const winner = result2.updatedPlayers.find(p => p.id === 'p1');
      expect(winner?.hand).toHaveLength(2); // Gets both cards back
      expect(winner?.hand).toContainEqual(card1);
      expect(winner?.hand).toContainEqual(card2);
      
      // Jhabbu player leads next
      expect(result2.nextLeaderId).toBe('p2');
    });
  });

  describe('checkPlayerElimination', () => {
    it('should eliminate players with empty hands', () => {
      const player1 = createPlayer('p1', 'Player 1', []); // Empty hand
      const player2 = createPlayer('p2', 'Player 2', [createCard('hearts', 'A')]);
      const players = [player1, player2];

      const result = checkPlayerElimination(players);

      expect(result.eliminatedPlayerIds).toContain('p1');
      expect(result.updatedPlayers[0].isActive).toBe(false);
      expect(result.updatedPlayers[1].isActive).toBe(true);
    });

    it('should detect game over when one player remains', () => {
      const player1 = createPlayer('p1', 'Player 1', []);
      const player2 = createPlayer('p2', 'Player 2', [createCard('hearts', 'A')]);
      const players = [player1, player2];

      const result = checkPlayerElimination(players);

      expect(result.gameOver).toBe(true);
      expect(result.loserId).toBe('p2');
    });

    it('should not end game when multiple players remain', () => {
      const player1 = createPlayer('p1', 'Player 1', [createCard('hearts', 'A')]);
      const player2 = createPlayer('p2', 'Player 2', [createCard('hearts', 'K')]);
      const players = [player1, player2];

      const result = checkPlayerElimination(players);

      expect(result.gameOver).toBe(false);
      expect(result.loserId).toBe(null);
    });

    it('should not eliminate already inactive players', () => {
      const player1 = createPlayer('p1', 'Player 1', [], [], false); // Already inactive
      const player2 = createPlayer('p2', 'Player 2', [createCard('hearts', 'A')]);
      const players = [player1, player2];

      const result = checkPlayerElimination(players);

      expect(result.eliminatedPlayerIds).toHaveLength(0); // p1 was already inactive
      expect(result.updatedPlayers[0].isActive).toBe(false);
    });
  });

  describe('handlePhase2TrickWithElimination', () => {
    it('should handle trick completion and check for elimination', () => {
      const card1 = createCard('hearts', 'A', 'h-a-1');
      const card2 = createCard('hearts', 'K', 'h-k-1');
      const card3 = createCard('hearts', 'Q', 'h-q-1');
      // p1 has 2 cards, p2 has 1 card
      const player1 = createPlayer('p1', 'Player 1', [card1, card3]);
      const player2 = createPlayer('p2', 'Player 2', [card2]);
      const players = [player1, player2];

      // First player plays
      const result1 = handlePhase2TrickWithElimination('p1', [card1], players, [], null, 'p1');
      expect(result1.gameOver).toBe(false);

      // Second player plays (empties their hand)
      const result2 = handlePhase2TrickWithElimination(
        'p2',
        [card2],
        result1.updatedPlayers,
        result1.updatedTrickCards,
        result1.leadSuit,
        'p2'
      );

      expect(result2.trickComplete).toBe(true);
      expect(result2.eliminatedPlayerIds).toContain('p2'); // p2 emptied hand
      expect(result2.gameOver).toBe(true);
      expect(result2.loserId).toBe('p1'); // p1 still has cards in hand
    });
  });

  describe('transitionToPhase2', () => {
    it('should move side deck to hand for all players', () => {
      const card1 = createCard('hearts', 'A');
      const card2 = createCard('hearts', 'K');
      const player1 = createPlayer('p1', 'Player 1', [], [card1]);
      const player2 = createPlayer('p2', 'Player 2', [], [card2]);
      
      // Set up players with cards in side deck (from Phase 1)
      player1.sideDeck = [card1];
      player2.sideDeck = [card2];
      const players = [player1, player2];

      const { transitionToPhase2 } = require('./phase2Logic');
      const result = transitionToPhase2(players);

      expect(result[0].hand).toContainEqual(card1);
      expect(result[0].sideDeck).toHaveLength(0);
      expect(result[0].isActive).toBe(true);

      expect(result[1].hand).toContainEqual(card2);
      expect(result[1].sideDeck).toHaveLength(0);
      expect(result[1].isActive).toBe(true);
    });

    it('should mark players with empty side deck as inactive winners', () => {
      const card1 = createCard('hearts', 'A');
      const player1 = createPlayer('p1', 'Player 1', [], [card1]);
      const player2 = createPlayer('p2', 'Player 2', [], []); // No penalties in Phase 1
      
      player1.sideDeck = [card1];
      player2.sideDeck = []; // Empty side deck
      const players = [player1, player2];

      const { transitionToPhase2 } = require('./phase2Logic');
      const result = transitionToPhase2(players);

      expect(result[0].isActive).toBe(true); // Has cards
      expect(result[1].isActive).toBe(false); // No cards - already won
      expect(result[1].hand).toHaveLength(0);
    });
  });

  describe('Tiebreaker: Identical Cards from Multiple Decks', () => {
    it('should award trick to first player when identical cards are played', () => {
      // Scenario: Multiple decks, two players play Ace of Hearts
      const aceHearts1 = createCard('hearts', 'A', 'hearts-A-deck0');
      const aceHearts2 = createCard('hearts', 'A', 'hearts-A-deck1');
      const kingHearts = createCard('hearts', 'K', 'hearts-K-deck0');

      const player1 = createPlayer('p1', 'Player 1', [aceHearts1]);
      const player2 = createPlayer('p2', 'Player 2', [aceHearts2]);
      const player3 = createPlayer('p3', 'Player 3', [kingHearts]);
      const players = [player1, player2, player3];

      // Simulate full trick with all three players
      const trickCards: TrickCard[] = [
        { card: aceHearts1, playerId: 'p1' },
        { card: aceHearts2, playerId: 'p2' },
        { card: kingHearts, playerId: 'p3' }
      ];

      // Use the trick engine directly to determine winner
      const { determineTrickWinner } = require('./trickEngine');
      const winnerId = determineTrickWinner(trickCards, 'hearts');

      // First player to play Ace of Hearts should win (and be penalized with all cards)
      expect(winnerId).toBe('p1');
    });

    it('should demonstrate strategic disadvantage of playing high card first', () => {
      // This test shows that in Phase 2, winning is BAD
      // Playing a high card first is risky if others have the same card
      
      const aceSpades1 = createCard('spades', 'A', 'spades-A-deck0');
      const aceSpades2 = createCard('spades', 'A', 'spades-A-deck1');

      const player1 = createPlayer('p1', 'Player 1', [aceSpades1]);
      const player2 = createPlayer('p2', 'Player 2', [aceSpades2]);
      const players = [player1, player2];

      const trickCards: TrickCard[] = [
        { card: aceSpades1, playerId: 'p1' },
        { card: aceSpades2, playerId: 'p2' }
      ];

      const { determineTrickWinner } = require('./trickEngine');
      const winnerId = determineTrickWinner(trickCards, 'spades');
      
      // Player 1 "wins" (gets penalized) because they played first
      expect(winnerId).toBe('p1');
      
      // In the actual game, Player 1 would receive both Aces (bad!)
      // and Player 2 would have an empty hand (good!)
    });

    it('should handle three identical cards with first player winning', () => {
      // Edge case: Three players all have King of Diamonds from different decks
      const kingDiamonds1 = createCard('diamonds', 'K', 'diamonds-K-deck0');
      const kingDiamonds2 = createCard('diamonds', 'K', 'diamonds-K-deck1');
      const kingDiamonds3 = createCard('diamonds', 'K', 'diamonds-K-deck2');

      const trickCards: TrickCard[] = [
        { card: kingDiamonds1, playerId: 'p1' },
        { card: kingDiamonds2, playerId: 'p2' },
        { card: kingDiamonds3, playerId: 'p3' }
      ];

      const { determineTrickWinner } = require('./trickEngine');
      const winnerId = determineTrickWinner(trickCards, 'diamonds');
      
      // First player wins (and gets all three Kings - very bad!)
      expect(winnerId).toBe('p1');
    });
  });
});

