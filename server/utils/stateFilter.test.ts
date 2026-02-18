/**
 * Tests for State Filter
 * Validates that player hands are properly filtered for security
 */

import { filterGameStateForPlayer, filterGameStateForSpectator } from './stateFilter';
import { GameState, Player, Card } from '../types';

describe('State Filter', () => {
  // Helper to create a test card
  const createCard = (suit: 'hearts' | 'diamonds' | 'clubs' | 'spades', rank: string, id: string): Card => ({
    suit,
    rank: rank as any,
    id
  });

  // Helper to create a test player
  const createPlayer = (id: string, name: string, handSize: number): Player => ({
    id,
    name,
    hand: Array.from({ length: handSize }, (_, i) => createCard('hearts', 'A', `${id}-card-${i}`)),
    sideDeck: [],
    isActive: true,
    isHost: id === 'player1',
    position: 0
  });

  // Helper to create a test game state
  const createGameState = (): GameState => ({
    phase: 'BERIZ',
    roomId: 'TEST123',
    hostId: 'player1',
    maxPlayers: 4,
    players: [
      createPlayer('player1', 'Alice', 5),
      createPlayer('player2', 'Bob', 5),
      createPlayer('player3', 'Charlie', 5)
    ],
    currentPlayerIndex: 0,
    dealerId: 'player1',
    table: [],
    leadSuit: null,
    trickCards: [],
    loser: null
  });

  describe('filterGameStateForPlayer', () => {
    it('should allow player to see their own hand', () => {
      const gameState = createGameState();
      const filtered = filterGameStateForPlayer(gameState, 'player1');

      const player1 = filtered.players.find(p => p.id === 'player1')!;
      expect(player1.hand).toHaveLength(5);
      expect(player1.hand[0].id).toBe('player1-card-0');
      expect(player1.hand[0].suit).toBe('hearts');
    });

    it('should hide other players hands', () => {
      const gameState = createGameState();
      const filtered = filterGameStateForPlayer(gameState, 'player1');

      const player2 = filtered.players.find(p => p.id === 'player2')!;
      expect(player2.hand).toHaveLength(5);
      expect(player2.hand[0].id).toBe('hidden');
      
      const player3 = filtered.players.find(p => p.id === 'player3')!;
      expect(player3.hand).toHaveLength(5);
      expect(player3.hand[0].id).toBe('hidden');
    });

    it('should preserve hand count for hidden hands', () => {
      const gameState = createGameState();
      gameState.players[1].hand = Array.from({ length: 3 }, (_, i) => 
        createCard('diamonds', 'K', `player2-card-${i}`)
      );

      const filtered = filterGameStateForPlayer(gameState, 'player1');
      const player2 = filtered.players.find(p => p.id === 'player2')!;
      
      expect(player2.hand).toHaveLength(3);
      expect(player2.hand.every(card => card.id === 'hidden')).toBe(true);
    });

    it('should not modify other game state properties', () => {
      const gameState = createGameState();
      const filtered = filterGameStateForPlayer(gameState, 'player1');

      expect(filtered.phase).toBe('BERIZ');
      expect(filtered.roomId).toBe('TEST123');
      expect(filtered.currentPlayerIndex).toBe(0);
      expect(filtered.players).toHaveLength(3);
    });

    it('should work for any player', () => {
      const gameState = createGameState();
      
      // Test for player2
      const filtered2 = filterGameStateForPlayer(gameState, 'player2');
      const player2View = filtered2.players.find(p => p.id === 'player2')!;
      expect(player2View.hand[0].id).toBe('player2-card-0');
      
      const player1FromPlayer2View = filtered2.players.find(p => p.id === 'player1')!;
      expect(player1FromPlayer2View.hand[0].id).toBe('hidden');
    });
  });

  describe('filterGameStateForSpectator', () => {
    it('should hide all players hands', () => {
      const gameState = createGameState();
      const filtered = filterGameStateForSpectator(gameState);

      for (const player of filtered.players) {
        expect(player.hand.every(card => card.id === 'hidden')).toBe(true);
      }
    });

    it('should preserve hand counts', () => {
      const gameState = createGameState();
      gameState.players[0].hand = Array.from({ length: 2 }, (_, i) => 
        createCard('clubs', 'Q', `p1-${i}`)
      );
      gameState.players[1].hand = Array.from({ length: 7 }, (_, i) => 
        createCard('spades', 'J', `p2-${i}`)
      );

      const filtered = filterGameStateForSpectator(gameState);
      
      expect(filtered.players[0].hand).toHaveLength(2);
      expect(filtered.players[1].hand).toHaveLength(7);
    });
  });

  describe('Security - Hand Privacy', () => {
    it('should never expose actual card data to other players', () => {
      const gameState = createGameState();
      
      // Give player2 specific cards
      gameState.players[1].hand = [
        createCard('spades', 'K', 'secret-card-1'),
        createCard('diamonds', 'Q', 'secret-card-2')
      ];

      const filtered = filterGameStateForPlayer(gameState, 'player1');
      const player2 = filtered.players.find(p => p.id === 'player2')!;

      // Verify no secret card IDs are exposed
      expect(player2.hand.some(card => card.id === 'secret-card-1')).toBe(false);
      expect(player2.hand.some(card => card.id === 'secret-card-2')).toBe(false);
    });

    it('should handle empty hands', () => {
      const gameState = createGameState();
      gameState.players[1].hand = [];

      const filtered = filterGameStateForPlayer(gameState, 'player1');
      const player2 = filtered.players.find(p => p.id === 'player2')!;

      expect(player2.hand).toHaveLength(0);
    });
  });
});
