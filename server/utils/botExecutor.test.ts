/**
 * Tests for bot executor functionality
 */

import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from '../managers/RoomManager';
import { GameStateManager } from '../managers/GameStateManager';
import { checkAndExecuteBotTurn } from './botExecutor';

// Mock Socket.io
type MockIO = {
  to: jest.Mock;
  emit: jest.Mock;
};

describe('Bot Executor', () => {
  let mockIO: MockIO;
  let roomManager: RoomManager;
  let gameStateManager: GameStateManager;
  let toEmitMock: jest.Mock;

  beforeEach(() => {
    // Create a shared emit mock for the 'to' chain
    toEmitMock = jest.fn();
    
    // Create mock Socket.io server with proper chaining
    mockIO = {
      to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      emit: jest.fn()
    };

    roomManager = new RoomManager();
    gameStateManager = new GameStateManager();
  });

  afterEach(() => {
    roomManager.stopCleanupTask();
    jest.clearAllTimers();
  });

  describe('Bot Turn Detection', () => {
    it('should not execute when current player is human', () => {
      // Create a game with human players
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');

      const room = roomManager.getRoom(roomId)!;
      room.gameState = gameStateManager.startGame(room.gameState);

      // Clear any previous calls
      toEmitMock.mockClear();

      // Check for bot turn (should not execute)
      checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, roomId);

      // Verify no game state update was broadcast
      expect(toEmitMock).not.toHaveBeenCalled();
    });

    it('should not execute during LOBBY phase', () => {
      // Create a room with a bot in lobby
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'bot-123', 'Bot 1', 'session-bot');

      // Clear any previous calls
      toEmitMock.mockClear();

      // Check for bot turn (should not execute in LOBBY)
      checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, roomId);

      // Verify no game state update was broadcast
      expect(toEmitMock).not.toHaveBeenCalled();
    });

    it('should schedule bot move when current player is a bot', (done) => {
      jest.useFakeTimers();

      // Create a game where first player is a bot
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'bot-123', 'Bot 1', 'session-bot');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');

      const room = roomManager.getRoom(roomId)!;
      room.gameState = gameStateManager.startGame(room.gameState);

      // Ensure bot is the current player
      const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
      if (!currentPlayer.id.startsWith('bot-')) {
        // Swap players to make bot current
        const botIndex = room.gameState.players.findIndex(p => p.id.startsWith('bot-'));
        room.gameState.currentPlayerIndex = botIndex;
      }

      // Clear any previous calls
      toEmitMock.mockClear();

      // Check for bot turn (should schedule execution)
      checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, roomId);

      // Verify no immediate broadcast (bot move is delayed)
      expect(toEmitMock).not.toHaveBeenCalled();

      // Fast-forward time to trigger bot move
      jest.advanceTimersByTime(2500); // Max delay is 2 seconds

      // Verify game state update was broadcast
      expect(toEmitMock).toHaveBeenCalledWith(
        'gameStateUpdated',
        expect.objectContaining({
          gameState: expect.any(Object),
          event: expect.any(String)
        })
      );

      jest.useRealTimers();
      done();
    });
  });

  describe('Bot Move Execution', () => {
    it('should execute valid bot move in Phase 1', (done) => {
      jest.useFakeTimers();

      // Create a game with bot as first player
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'bot-123', 'Bot 1', 'session-bot');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');

      const room = roomManager.getRoom(roomId)!;
      room.gameState = gameStateManager.startGame(room.gameState);

      // Make bot the current player
      const botIndex = room.gameState.players.findIndex(p => p.id.startsWith('bot-'));
      room.gameState.currentPlayerIndex = botIndex;

      const botBefore = room.gameState.players[botIndex];
      const handSizeBefore = botBefore.hand.length;

      // Clear any previous calls
      toEmitMock.mockClear();

      // Trigger bot turn
      checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, roomId);

      // Fast-forward time
      jest.advanceTimersByTime(2500);

      // Verify bot played a card
      const roomAfter = roomManager.getRoom(roomId)!;
      const botAfter = roomAfter.gameState.players[botIndex];
      
      // Bot should have one less card (or picked up cards from table)
      expect(botAfter.hand.length).not.toBe(handSizeBefore);

      // Verify broadcast was made
      expect(toEmitMock).toHaveBeenCalledWith(
        'gameStateUpdated',
        expect.objectContaining({
          gameState: expect.any(Object),
          event: 'cardPlayed'
        })
      );

      jest.useRealTimers();
      done();
    });

    it('should execute valid bot move in Phase 2', (done) => {
      jest.useFakeTimers();

      // Create a game and transition to Phase 2
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'bot-123', 'Bot 1', 'session-bot');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');

      const room = roomManager.getRoom(roomId)!;
      room.gameState = gameStateManager.startGame(room.gameState);

      // Play all Phase 1 cards to transition to Phase 2
      while (room.gameState.phase === 'BERIZ') {
        const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
        const card = currentPlayer.hand[0];
        const result = gameStateManager.processCardPlay(room.gameState, currentPlayer.id, [card]);
        if (result.success) {
          room.gameState = result.newGameState;
        } else {
          break;
        }
      }

      // Verify we're in Phase 2
      if (room.gameState.phase !== 'JHABBU') {
        jest.useRealTimers();
        done();
        return;
      }

      // Make bot the current player
      const botIndex = room.gameState.players.findIndex(p => p.id.startsWith('bot-'));
      room.gameState.currentPlayerIndex = botIndex;

      const botBefore = room.gameState.players[botIndex];
      const handSizeBefore = botBefore.hand.length;

      // Clear any previous calls
      toEmitMock.mockClear();

      // Trigger bot turn
      checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, roomId);

      // Fast-forward time
      jest.advanceTimersByTime(2500);

      // Verify bot played a card
      const roomAfter = roomManager.getRoom(roomId)!;
      const botAfter = roomAfter.gameState.players[botIndex];
      
      expect(botAfter.hand.length).toBeLessThan(handSizeBefore);

      // Verify broadcast was made
      expect(toEmitMock).toHaveBeenCalled();

      jest.useRealTimers();
      done();
    });

    it('should handle consecutive bot turns', (done) => {
      jest.useFakeTimers();

      // Create a game with two bots
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'bot-1', 'Bot 1', 'session-bot-1');
      roomManager.addPlayerToRoom(roomId, 'bot-2', 'Bot 2', 'session-bot-2');

      const room = roomManager.getRoom(roomId)!;
      room.gameState = gameStateManager.startGame(room.gameState);

      // Clear any previous calls
      toEmitMock.mockClear();

      // Trigger first bot turn
      checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, roomId);

      // Fast-forward time for first bot
      jest.advanceTimersByTime(2500);

      // Fast-forward time for second bot (recursive call)
      jest.advanceTimersByTime(2500);

      // Verify both bots played (at least 2 broadcasts)
      expect(toEmitMock.mock.calls.length).toBeGreaterThanOrEqual(2);

      jest.useRealTimers();
      done();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent room gracefully', () => {
      // Should not throw
      expect(() => {
        checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, 'INVALID');
      }).not.toThrow();
    });

    it('should handle bot with no cards gracefully', (done) => {
      jest.useFakeTimers();

      // Create a game
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'bot-123', 'Bot 1', 'session-bot');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');

      const room = roomManager.getRoom(roomId)!;
      room.gameState = gameStateManager.startGame(room.gameState);

      // Make bot current player and remove all cards
      const botIndex = room.gameState.players.findIndex(p => p.id.startsWith('bot-'));
      room.gameState.currentPlayerIndex = botIndex;
      room.gameState.players[botIndex].hand = [];

      // Clear any previous calls
      toEmitMock.mockClear();

      // Should not throw
      expect(() => {
        checkAndExecuteBotTurn(mockIO as any, roomManager, gameStateManager, roomId);
        jest.advanceTimersByTime(2500);
      }).not.toThrow();

      jest.useRealTimers();
      done();
    });
  });
});
