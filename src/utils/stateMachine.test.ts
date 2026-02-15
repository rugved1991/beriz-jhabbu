import {
  isValidTransition,
  transitionToLobby,
  transitionToDealing,
  transitionToBeriz,
  transitionToJhabbu,
  transitionToGameOver,
  transitionToPhase,
} from './stateMachine';
import { GameState, GamePhase, Player, Card } from '../types';

// Helper function to create a minimal game state
function createGameState(phase: GamePhase, players: Player[] = []): GameState {
  return {
    phase,
    roomId: 'TEST123',
    hostId: 'player1',
    maxPlayers: 4,
    players,
    currentPlayerIndex: 0,
    dealerId: players.length > 0 ? players[0].id : '',
    table: [],
    leadSuit: null,
    trickCards: [],
    loser: null,
  };
}

// Helper function to create a player
function createPlayer(
  id: string,
  handSize: number = 0,
  sideDeckSize: number = 0
): Player {
  const hand: Card[] = Array.from({ length: handSize }, (_, i) => ({
    suit: 'hearts',
    rank: '2',
    id: `${id}-hand-${i}`,
  }));

  const sideDeck: Card[] = Array.from({ length: sideDeckSize }, (_, i) => ({
    suit: 'clubs',
    rank: '3',
    id: `${id}-side-${i}`,
  }));

  return {
    id,
    name: `Player ${id}`,
    hand,
    sideDeck,
    isActive: true,
    isHost: id === 'player1',
    position: parseInt(id.replace('player', '')) - 1,
  };
}

describe('State Machine', () => {
  describe('isValidTransition', () => {
    it('should allow SETUP -> LOBBY', () => {
      expect(isValidTransition('SETUP', 'LOBBY')).toBe(true);
    });

    it('should allow LOBBY -> DEALING', () => {
      expect(isValidTransition('LOBBY', 'DEALING')).toBe(true);
    });

    it('should allow DEALING -> BERIZ', () => {
      expect(isValidTransition('DEALING', 'BERIZ')).toBe(true);
    });

    it('should allow BERIZ -> JHABBU', () => {
      expect(isValidTransition('BERIZ', 'JHABBU')).toBe(true);
    });

    it('should allow JHABBU -> GAME_OVER', () => {
      expect(isValidTransition('JHABBU', 'GAME_OVER')).toBe(true);
    });

    it('should not allow invalid transitions', () => {
      expect(isValidTransition('SETUP', 'DEALING')).toBe(false);
      expect(isValidTransition('SETUP', 'BERIZ')).toBe(false);
      expect(isValidTransition('LOBBY', 'BERIZ')).toBe(false);
      expect(isValidTransition('DEALING', 'JHABBU')).toBe(false);
      expect(isValidTransition('BERIZ', 'GAME_OVER')).toBe(false);
    });

    it('should not allow transitions from GAME_OVER', () => {
      expect(isValidTransition('GAME_OVER', 'SETUP')).toBe(false);
      expect(isValidTransition('GAME_OVER', 'LOBBY')).toBe(false);
      expect(isValidTransition('GAME_OVER', 'DEALING')).toBe(false);
    });
  });

  describe('transitionToLobby', () => {
    it('should transition from SETUP to LOBBY', () => {
      const state = createGameState('SETUP');
      const newState = transitionToLobby(state);
      expect(newState.phase).toBe('LOBBY');
    });

    it('should throw error when transitioning from invalid phase', () => {
      const state = createGameState('DEALING');
      expect(() => transitionToLobby(state)).toThrow('Invalid transition from DEALING to LOBBY');
    });

    it('should preserve other state properties', () => {
      const state = createGameState('SETUP');
      const newState = transitionToLobby(state);
      expect(newState.roomId).toBe(state.roomId);
      expect(newState.hostId).toBe(state.hostId);
      expect(newState.maxPlayers).toBe(state.maxPlayers);
    });
  });

  describe('transitionToDealing', () => {
    it('should transition from LOBBY to DEALING with valid players', () => {
      const players = [createPlayer('player1'), createPlayer('player2')];
      const state = createGameState('LOBBY', players);
      const newState = transitionToDealing(state);
      expect(newState.phase).toBe('DEALING');
    });

    it('should throw error when transitioning from invalid phase', () => {
      const players = [createPlayer('player1'), createPlayer('player2')];
      const state = createGameState('SETUP', players);
      expect(() => transitionToDealing(state)).toThrow('Invalid transition from SETUP to DEALING');
    });

    it('should throw error with less than 2 players', () => {
      const players = [createPlayer('player1')];
      const state = createGameState('LOBBY', players);
      expect(() => transitionToDealing(state)).toThrow('Cannot start game with less than 2 players');
    });

    it('should throw error with no players', () => {
      const state = createGameState('LOBBY', []);
      expect(() => transitionToDealing(state)).toThrow('Cannot start game with less than 2 players');
    });
  });

  describe('transitionToBeriz', () => {
    it('should transition from DEALING to BERIZ when all players have cards', () => {
      const players = [
        createPlayer('player1', 5),
        createPlayer('player2', 5),
      ];
      const state = createGameState('DEALING', players);
      const newState = transitionToBeriz(state);
      expect(newState.phase).toBe('BERIZ');
      expect(newState.currentPlayerIndex).toBe(0);
    });

    it('should throw error when transitioning from invalid phase', () => {
      const players = [createPlayer('player1', 5), createPlayer('player2', 5)];
      const state = createGameState('LOBBY', players);
      expect(() => transitionToBeriz(state)).toThrow('Invalid transition from LOBBY to BERIZ');
    });

    it('should throw error when not all players have cards', () => {
      const players = [
        createPlayer('player1', 5),
        createPlayer('player2', 0), // No cards
      ];
      const state = createGameState('DEALING', players);
      expect(() => transitionToBeriz(state)).toThrow('Cannot transition to BERIZ: not all players have cards');
    });
  });

  describe('transitionToJhabbu', () => {
    it('should transition from BERIZ to JHABBU when all hands are empty', () => {
      const players = [
        createPlayer('player1', 0, 3), // Empty hand, cards in side deck
        createPlayer('player2', 0, 2),
      ];
      const state = createGameState('BERIZ', players);
      const newState = transitionToJhabbu(state);
      expect(newState.phase).toBe('JHABBU');
      expect(newState.table).toEqual([]);
      expect(newState.leadSuit).toBeNull();
      expect(newState.trickCards).toEqual([]);
    });

    it('should throw error when transitioning from invalid phase', () => {
      const players = [createPlayer('player1', 0), createPlayer('player2', 0)];
      const state = createGameState('DEALING', players);
      expect(() => transitionToJhabbu(state)).toThrow('Invalid transition from DEALING to JHABBU');
    });

    it('should clear the table when transitioning', () => {
      const players = [createPlayer('player1', 0), createPlayer('player2', 0)];
      const state = {
        ...createGameState('BERIZ', players),
        table: [{ suit: 'hearts' as const, rank: '5' as const, id: 'card1' }],
      };
      const newState = transitionToJhabbu(state);
      expect(newState.table).toEqual([]);
    });
  });

  describe('transitionToGameOver', () => {
    it('should transition from JHABBU to GAME_OVER when one player has cards', () => {
      const players = [
        createPlayer('player1', 0, 0), // No cards in hand - winner
        createPlayer('player2', 3, 0), // Has cards in hand - loser (in Phase 2, cards are in hand)
        createPlayer('player3', 0, 0), // No cards in hand - winner
      ];
      const state = createGameState('JHABBU', players);
      const newState = transitionToGameOver(state);
      expect(newState.phase).toBe('GAME_OVER');
      expect(newState.loser).toBe('player2');
    });

    it('should throw error when transitioning from invalid phase', () => {
      const players = [
        createPlayer('player1', 0, 0),
        createPlayer('player2', 3, 0),
      ];
      const state = createGameState('BERIZ', players);
      expect(() => transitionToGameOver(state)).toThrow('Invalid transition from BERIZ to GAME_OVER');
    });

    it('should throw error when multiple players have cards', () => {
      const players = [
        createPlayer('player1', 2, 0), // Has cards in hand
        createPlayer('player2', 3, 0), // Has cards in hand
      ];
      const state = createGameState('JHABBU', players);
      expect(() => transitionToGameOver(state)).toThrow('Cannot transition to GAME_OVER: expected 1 player with cards, found 2');
    });

    it('should throw error when no players have cards', () => {
      const players = [
        createPlayer('player1', 0, 0),
        createPlayer('player2', 0, 0),
      ];
      const state = createGameState('JHABBU', players);
      expect(() => transitionToGameOver(state)).toThrow('Cannot transition to GAME_OVER: expected 1 player with cards, found 0');
    });
  });

  describe('transitionToPhase', () => {
    it('should route to correct transition function for LOBBY', () => {
      const state = createGameState('SETUP');
      const newState = transitionToPhase(state, 'LOBBY');
      expect(newState.phase).toBe('LOBBY');
    });

    it('should route to correct transition function for DEALING', () => {
      const players = [createPlayer('player1'), createPlayer('player2')];
      const state = createGameState('LOBBY', players);
      const newState = transitionToPhase(state, 'DEALING');
      expect(newState.phase).toBe('DEALING');
    });

    it('should route to correct transition function for BERIZ', () => {
      const players = [createPlayer('player1', 5), createPlayer('player2', 5)];
      const state = createGameState('DEALING', players);
      const newState = transitionToPhase(state, 'BERIZ');
      expect(newState.phase).toBe('BERIZ');
    });

    it('should route to correct transition function for JHABBU', () => {
      const players = [createPlayer('player1', 0), createPlayer('player2', 0)];
      const state = createGameState('BERIZ', players);
      const newState = transitionToPhase(state, 'JHABBU');
      expect(newState.phase).toBe('JHABBU');
    });

    it('should route to correct transition function for GAME_OVER', () => {
      const players = [
        createPlayer('player1', 0, 0),
        createPlayer('player2', 3, 0), // Cards in hand for Phase 2
      ];
      const state = createGameState('JHABBU', players);
      const newState = transitionToPhase(state, 'GAME_OVER');
      expect(newState.phase).toBe('GAME_OVER');
    });

    it('should throw error when trying to transition to SETUP', () => {
      const state = createGameState('LOBBY');
      expect(() => transitionToPhase(state, 'SETUP')).toThrow('Cannot transition back to SETUP phase');
    });
  });

  describe('Complete state machine flow', () => {
    it('should successfully transition through all phases', () => {
      // SETUP -> LOBBY
      let state = createGameState('SETUP');
      state = transitionToLobby(state);
      expect(state.phase).toBe('LOBBY');

      // Add players
      state.players = [createPlayer('player1'), createPlayer('player2')];

      // LOBBY -> DEALING
      state = transitionToDealing(state);
      expect(state.phase).toBe('DEALING');

      // Deal cards
      state.players = [createPlayer('player1', 5), createPlayer('player2', 5)];

      // DEALING -> BERIZ
      state = transitionToBeriz(state);
      expect(state.phase).toBe('BERIZ');

      // Empty hands (Phase 1 complete)
      state.players = [
        createPlayer('player1', 0, 3),
        createPlayer('player2', 0, 2),
      ];

      // BERIZ -> JHABBU
      state = transitionToJhabbu(state);
      expect(state.phase).toBe('JHABBU');

      // One player empties hand (Phase 2 uses hand, not sideDeck)
      state.players = [
        createPlayer('player1', 0, 0),
        createPlayer('player2', 2, 0), // Cards in hand for Phase 2
      ];

      // JHABBU -> GAME_OVER
      state = transitionToGameOver(state);
      expect(state.phase).toBe('GAME_OVER');
      expect(state.loser).toBe('player2');
    });
  });
});
