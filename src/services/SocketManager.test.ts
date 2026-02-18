import { SocketManager } from './SocketManager';
import { io, Socket } from 'socket.io-client';
import { GameState, Card } from '../types';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('SocketManager', () => {
  let socketManager: SocketManager;
  let mockSocket: any;

  beforeEach(() => {
    // Create a mock socket with all necessary methods
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    // Mock io to return our mock socket
    (io as jest.Mock).mockReturnValue(mockSocket);

    // Create a new instance for each test
    socketManager = new SocketManager('http://localhost:3001');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should establish connection when connect is called', () => {
      socketManager.connect();

      expect(io).toHaveBeenCalledWith('http://localhost:3001', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });
    });

    it('should not create duplicate connection if already connected', () => {
      mockSocket.connected = true;
      socketManager.connect();
      socketManager.connect();

      // Should only be called once
      expect(io).toHaveBeenCalledTimes(1);
    });

    it('should register connection event handlers', () => {
      socketManager.connect();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });

    it('should disconnect when disconnect is called', () => {
      socketManager.connect();
      socketManager.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should return connection status', () => {
      socketManager.connect();
      mockSocket.connected = false;
      expect(socketManager.isConnected()).toBe(false);

      mockSocket.connected = true;
      expect(socketManager.isConnected()).toBe(true);
    });
  });

  describe('Room Operations', () => {
    beforeEach(() => {
      socketManager.connect();
    });

    it('should create room and return roomId and sessionId', async () => {
      const mockResponse = {
        success: true,
        roomId: 'ABC123',
        sessionId: 'session-123'
      };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      const result = await socketManager.createRoom(4);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'createRoom',
        { maxPlayers: 4 },
        expect.any(Function)
      );
      expect(result).toEqual({
        roomId: 'ABC123',
        sessionId: 'session-123'
      });
    });

    it('should reject createRoom if not connected', async () => {
      socketManager.disconnect();

      await expect(socketManager.createRoom(4)).rejects.toThrow('Not connected');
    });

    it('should reject createRoom on server error', async () => {
      const mockResponse = {
        success: false,
        error: 'Server error'
      };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await expect(socketManager.createRoom(4)).rejects.toThrow('Server error');
    });

    it('should join room with player name', async () => {
      const mockGameState: GameState = {
        phase: 'LOBBY',
        roomId: 'ABC123',
        hostId: 'player-1',
        maxPlayers: 4,
        players: [],
        currentPlayerIndex: 0,
        dealerId: '',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const mockResponse = {
        success: true,
        sessionId: 'session-123',
        playerId: 'player-1',
        gameState: mockGameState
      };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      const result = await socketManager.joinRoom('ABC123', 'Player 1');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'joinRoom',
        { roomId: 'ABC123', playerName: 'Player 1', sessionId: undefined },
        expect.any(Function)
      );
      expect(result).toEqual({
        sessionId: 'session-123',
        playerId: 'player-1',
        gameState: mockGameState
      });
    });

    it('should join room with existing sessionId for reconnection', async () => {
      const mockGameState: GameState = {
        phase: 'BERIZ',
        roomId: 'ABC123',
        hostId: 'player-1',
        maxPlayers: 4,
        players: [],
        currentPlayerIndex: 0,
        dealerId: 'player-1',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };

      const mockResponse = {
        success: true,
        sessionId: 'session-123',
        playerId: 'player-1',
        gameState: mockGameState
      };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      const result = await socketManager.joinRoom('ABC123', 'Player 1', 'session-123');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'joinRoom',
        { roomId: 'ABC123', playerName: 'Player 1', sessionId: 'session-123' },
        expect.any(Function)
      );
      expect(result.sessionId).toBe('session-123');
    });

    it('should reject joinRoom on error', async () => {
      const mockResponse = {
        success: false,
        error: 'Room is full'
      };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await expect(socketManager.joinRoom('ABC123', 'Player 1')).rejects.toThrow('Room is full');
    });
  });

  describe('Game Actions', () => {
    beforeEach(() => {
      socketManager.connect();
    });

    it('should start game successfully', async () => {
      const mockResponse = { success: true };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await socketManager.startGame('ABC123', 'player-1');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'startGame',
        { roomId: 'ABC123', playerId: 'player-1' },
        expect.any(Function)
      );
    });

    it('should reject startGame if not host', async () => {
      const mockResponse = {
        success: false,
        error: 'Only host can start game'
      };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await expect(socketManager.startGame('ABC123', 'player-2')).rejects.toThrow('Only host can start game');
    });

    it('should play card successfully', async () => {
      const mockResponse = { success: true };
      const cards: Card[] = [
        { suit: 'hearts', rank: 'A', id: 'card-1' }
      ];

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await socketManager.playCard('ABC123', 'player-1', cards);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'playCard',
        { roomId: 'ABC123', playerId: 'player-1', cards },
        expect.any(Function)
      );
    });

    it('should reject playCard on invalid move', async () => {
      const mockResponse = {
        success: false,
        error: 'Not your turn'
      };
      const cards: Card[] = [
        { suit: 'hearts', rank: 'A', id: 'card-1' }
      ];

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await expect(socketManager.playCard('ABC123', 'player-1', cards)).rejects.toThrow('Not your turn');
    });

    it('should add bot successfully', async () => {
      const mockResponse = { success: true };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await socketManager.addBot('ABC123', 'player-1');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'addBot',
        { roomId: 'ABC123', playerId: 'player-1' },
        expect.any(Function)
      );
    });

    it('should reject addBot if not host', async () => {
      const mockResponse = {
        success: false,
        error: 'Unauthorized'
      };

      mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
        callback(mockResponse);
      });

      await expect(socketManager.addBot('ABC123', 'player-2')).rejects.toThrow('Unauthorized');
    });
  });

  describe('Event Listeners', () => {
    beforeEach(() => {
      socketManager.connect();
    });

    it('should register playerJoined event listener', () => {
      const callback = jest.fn();
      socketManager.onPlayerJoined(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('playerJoined', callback);
    });

    it('should register gameStarted event listener', () => {
      const callback = jest.fn();
      socketManager.onGameStarted(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('gameStarted', callback);
    });

    it('should register gameStateUpdated event listener', () => {
      const callback = jest.fn();
      socketManager.onGameStateUpdated(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('gameStateUpdated', callback);
    });

    it('should register playerReconnected event listener', () => {
      const callback = jest.fn();
      socketManager.onPlayerReconnected(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('playerReconnected', callback);
    });

    it('should register playerDisconnected event listener', () => {
      const callback = jest.fn();
      socketManager.onPlayerDisconnected(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('playerDisconnected', callback);
    });

    it('should remove event listener', () => {
      const callback = jest.fn();
      socketManager.off('playerJoined', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('playerJoined', callback);
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      socketManager.connect();
    });

    it('should track reconnection attempts', () => {
      expect(socketManager.getReconnectAttempts()).toBe(0);

      // Simulate reconnection attempt
      const reconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_attempt'
      )?.[1];

      if (reconnectHandler) {
        reconnectHandler(1);
        expect(socketManager.getReconnectAttempts()).toBe(1);

        reconnectHandler(2);
        expect(socketManager.getReconnectAttempts()).toBe(2);
      }
    });

    it('should reset reconnection attempts on successful connection', () => {
      // Simulate reconnection attempts
      const reconnectAttemptHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_attempt'
      )?.[1];

      if (reconnectAttemptHandler) {
        reconnectAttemptHandler(3);
        expect(socketManager.getReconnectAttempts()).toBe(3);
      }

      // Simulate successful reconnection
      const reconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect'
      )?.[1];

      if (reconnectHandler) {
        reconnectHandler(3);
        expect(socketManager.getReconnectAttempts()).toBe(0);
      }
    });
  });
});
