/**
 * Unit tests for GameStateManager
 */

import { GameStateManager } from './GameStateManager';
import { GameState, Player, Card } from '../../src/types';

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager();
  });

  describe('startGame', () => {
    it('should deal cards and transition to BERIZ phase', () => {
      const gameState: GameState = {
        phase: 'LOBBY',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { id: 'player1', name: 'Alice', hand: [], sideDeck: [], isActive: true, isHost: true, position: 0 },
          { id: 'player2', name: 'Bob', hand: [], sideDeck: [], isActive: true, isHost: false, position: 1 },
          { id: 'player3', name: 'Charlie', hand: [], sideDeck: [], isActive: true, isHost: false, position: 2 }
        ],
        currentPlayerIndex: 0,
        dealerId: '',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const result = gameStateManager.startGame(gameState);

      expect(result.phase).toBe('BERIZ');
      expect(result.dealerId).toBeTruthy();
      expect(result.players.every(p => p.hand.length > 0)).toBe(true);
      expect(result.players.every(p => p.sideDeck.length === 0)).toBe(true);
      expect(result.players.every(p => p.isActive)).toBe(true);
    });

    it('should rotate dealer on subsequent games', () => {
      const gameState: GameState = {
        phase: 'LOBBY',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { id: 'player1', name: 'Alice', hand: [], sideDeck: [], isActive: true, isHost: true, position: 0 },
          { id: 'player2', name: 'Bob', hand: [], sideDeck: [], isActive: true, isHost: false, position: 1 },
          { id: 'player3', name: 'Charlie', hand: [], sideDeck: [], isActive: true, isHost: false, position: 2 }
        ],
        currentPlayerIndex: 0,
        dealerId: 'player1',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const result = gameStateManager.startGame(gameState);

      expect(result.dealerId).toBe('player2');
    });
  });

  describe('processCardPlay', () => {
    it('should reject play when not player turn', () => {
      const gameState: GameState = {
        phase: 'BERIZ',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [{ suit: 'hearts', rank: 'A', id: 'h-A-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: true, 
            position: 0 
          },
          { 
            id: 'player2', 
            name: 'Bob', 
            hand: [{ suit: 'spades', rank: 'K', id: 's-K-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: false, 
            position: 1 
          }
        ],
        currentPlayerIndex: 0,
        dealerId: 'player1',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const card: Card = { suit: 'spades', rank: 'K', id: 's-K-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player2', [card]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should reject play in invalid phase', () => {
      const gameState: GameState = {
        phase: 'LOBBY',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [{ suit: 'hearts', rank: 'A', id: 'h-A-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: true, 
            position: 0 
          }
        ],
        currentPlayerIndex: 0,
        dealerId: 'player1',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const card: Card = { suit: 'hearts', rank: 'A', id: 'h-A-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player1', [card]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid game phase');
    });

    it('should process valid Phase 1 card play', () => {
      const gameState: GameState = {
        phase: 'BERIZ',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [{ suit: 'hearts', rank: 'A', id: 'h-A-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: true, 
            position: 0 
          },
          { 
            id: 'player2', 
            name: 'Bob', 
            hand: [{ suit: 'spades', rank: 'K', id: 's-K-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: false, 
            position: 1 
          }
        ],
        currentPlayerIndex: 0,
        dealerId: 'player1',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const card: Card = { suit: 'hearts', rank: 'A', id: 'h-A-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player1', [card]);

      expect(result.success).toBe(true);
      expect(result.event).toBe('cardPlayed');
      expect(result.newGameState.currentPlayerIndex).toBe(1);
      expect(result.newGameState.players[0].hand.length).toBe(0);
    });

    it('should handle Phase 1 card play with penalty', () => {
      const gameState: GameState = {
        phase: 'BERIZ',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [{ suit: 'hearts', rank: 'A', id: 'h-A-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: true, 
            position: 0 
          },
          { 
            id: 'player2', 
            name: 'Bob', 
            hand: [{ suit: 'spades', rank: 'K', id: 's-K-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: false, 
            position: 1 
          }
        ],
        currentPlayerIndex: 0,
        dealerId: 'player1',
        table: [{ suit: 'spades', rank: 'A', id: 's-A-1' }],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const card: Card = { suit: 'hearts', rank: 'A', id: 'h-A-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player1', [card]);

      expect(result.success).toBe(true);
      expect(result.newGameState.players[0].sideDeck.length).toBeGreaterThan(0);
      expect(result.newGameState.table.length).toBe(0);
    });

    it('should transition from BERIZ to JHABBU when Phase 1 completes', () => {
      const gameState: GameState = {
        phase: 'BERIZ',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [{ suit: 'hearts', rank: 'A', id: 'h-A-1' }], 
            sideDeck: [{ suit: 'clubs', rank: '2', id: 'c-2-1' }], 
            isActive: true, 
            isHost: true, 
            position: 0 
          },
          { 
            id: 'player2', 
            name: 'Bob', 
            hand: [], 
            sideDeck: [{ suit: 'spades', rank: 'K', id: 's-K-1' }], 
            isActive: true, 
            isHost: false, 
            position: 1 
          }
        ],
        currentPlayerIndex: 0,
        dealerId: 'player1',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const card: Card = { suit: 'hearts', rank: 'A', id: 'h-A-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player1', [card]);

      expect(result.success).toBe(true);
      expect(result.event).toBe('phaseTransition');
      expect(result.newGameState.phase).toBe('JHABBU');
      expect(result.newGameState.table).toEqual([]);
      expect(result.newGameState.trickCards).toEqual([]);
      expect(result.newGameState.players[0].hand.length).toBeGreaterThan(0);
      expect(result.newGameState.players[1].hand.length).toBeGreaterThan(0);
    });

    it('should process valid Phase 2 card play', () => {
      const gameState: GameState = {
        phase: 'JHABBU',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [
              { suit: 'hearts', rank: 'A', id: 'h-A-1' },
              { suit: 'hearts', rank: 'K', id: 'h-K-1' }
            ], 
            sideDeck: [], 
            isActive: true, 
            isHost: true, 
            position: 0 
          },
          { 
            id: 'player2', 
            name: 'Bob', 
            hand: [
              { suit: 'spades', rank: 'K', id: 's-K-1' },
              { suit: 'spades', rank: 'Q', id: 's-Q-1' }
            ], 
            sideDeck: [], 
            isActive: true, 
            isHost: false, 
            position: 1 
          }
        ],
        currentPlayerIndex: 0,
        dealerId: 'player1',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const card: Card = { suit: 'hearts', rank: 'A', id: 'h-A-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player1', [card]);

      expect(result.success).toBe(true);
      expect(result.newGameState.leadSuit).toBe('hearts');
      expect(result.newGameState.trickCards.length).toBe(1);
      expect(result.newGameState.players[0].hand.length).toBe(1);
      expect(result.newGameState.currentPlayerIndex).toBe(1);
    });

    it('should complete trick and determine winner in Phase 2', () => {
      const gameState: GameState = {
        phase: 'JHABBU',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [
              { suit: 'hearts', rank: 'K', id: 'h-K-1' },
              { suit: 'hearts', rank: '2', id: 'h-2-1' }
            ], 
            sideDeck: [], 
            isActive: true, 
            isHost: true, 
            position: 0 
          },
          { 
            id: 'player2', 
            name: 'Bob', 
            hand: [
              { suit: 'hearts', rank: 'Q', id: 'h-Q-1' },
              { suit: 'hearts', rank: '3', id: 'h-3-1' }
            ], 
            sideDeck: [], 
            isActive: true, 
            isHost: false, 
            position: 1 
          }
        ],
        currentPlayerIndex: 1,
        dealerId: 'player1',
        table: [],
        leadSuit: 'hearts',
        trickCards: [
          { card: { suit: 'hearts', rank: 'A', id: 'h-A-1' }, playerId: 'player1' }
        ],
        loser: null
      };

      const card: Card = { suit: 'hearts', rank: 'Q', id: 'h-Q-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player2', [card]);

      expect(result.success).toBe(true);
      expect(result.event).toBe('trickComplete');
      expect(result.newGameState.trickCards).toEqual([]);
      expect(result.newGameState.leadSuit).toBeNull();
    });

    it('should detect game over when only one player has cards', () => {
      const gameState: GameState = {
        phase: 'JHABBU',
        roomId: 'TEST123',
        hostId: 'player1',
        maxPlayers: 4,
        players: [
          { 
            id: 'player1', 
            name: 'Alice', 
            hand: [{ suit: 'hearts', rank: 'K', id: 'h-K-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: true, 
            position: 0 
          },
          { 
            id: 'player2', 
            name: 'Bob', 
            hand: [{ suit: 'hearts', rank: 'Q', id: 'h-Q-1' }], 
            sideDeck: [], 
            isActive: true, 
            isHost: false, 
            position: 1 
          }
        ],
        currentPlayerIndex: 1,
        dealerId: 'player1',
        table: [],
        leadSuit: 'hearts',
        trickCards: [
          { card: { suit: 'hearts', rank: 'A', id: 'h-A-1' }, playerId: 'player1' }
        ],
        loser: null
      };

      const card: Card = { suit: 'hearts', rank: 'Q', id: 'h-Q-1' };
      const result = gameStateManager.processCardPlay(gameState, 'player2', [card]);

      expect(result.success).toBe(true);
      expect(result.event).toBe('gameOver');
      expect(result.newGameState.phase).toBe('GAME_OVER');
      expect(result.newGameState.loser).toBe('player1');
    });
  });
});
