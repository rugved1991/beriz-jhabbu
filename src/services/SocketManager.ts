import { io, Socket } from 'socket.io-client';
import { GameState, Card } from '../types';

type EventCallback = (data: any) => void;

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

class SocketManager {
  private socket: Socket | null = null;
  private serverUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionStatus: ConnectionStatus = 'disconnected';

  constructor(serverUrl: string = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  connect(): void {
    if (this.socket?.connected) {
      console.log('Already connected to server');
      return;
    }

    this.socket = io(this.serverUrl, {
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
      this.connectionStatus = 'connected';
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connectionStatus = 'disconnected';
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      this.reconnectAttempts = attemptNumber;
      this.connectionStatus = 'reconnecting';
      console.log(`Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.log('Reconnection failed after maximum attempts');
      this.connectionStatus = 'disconnected';
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
      this.connectionStatus = 'connected';
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = 'disconnected';
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Room operations
  createRoom(maxPlayers: number): Promise<{ roomId: string; sessionId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('createRoom', { maxPlayers }, (response: any) => {
        if (response.success) {
          resolve({ roomId: response.roomId, sessionId: response.sessionId });
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }

  joinRoom(roomId: string, playerName: string, sessionId?: string): Promise<{ 
    sessionId: string; 
    playerId: string; 
    gameState: GameState 
  }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('joinRoom', { roomId, playerName, sessionId }, (response: any) => {
        if (response.success) {
          resolve({
            sessionId: response.sessionId,
            playerId: response.playerId,
            gameState: response.gameState
          });
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  getRoomInfo(roomId: string): Promise<{
    roomId: string;
    maxPlayers: number;
    currentPlayers: number;
    players: Array<{ id: string; name: string; isHost: boolean; position: number }>;
    phase: string;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('getRoomInfo', { roomId }, (response: any) => {
        if (response.success) {
          resolve(response.roomInfo);
        } else {
          reject(new Error(response.error || 'Failed to get room info'));
        }
      });
    });
  }

  startGame(roomId: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('startGame', { roomId, playerId }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to start game'));
        }
      });
    });
  }

  playCard(roomId: string, playerId: string, cards: Card[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('playCard', { roomId, playerId, cards }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to play card'));
        }
      });
    });
  }

  addBot(roomId: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('addBot', { roomId, playerId }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to add bot'));
        }
      });
    });
  }

  // Event listeners
  onPlayerJoined(callback: EventCallback): void {
    if (this.socket) {
      this.socket.on('playerJoined', callback);
    }
  }

  onGameStarted(callback: EventCallback): void {
    if (this.socket) {
      this.socket.on('gameStarted', callback);
    }
  }

  onGameStateUpdated(callback: EventCallback): void {
    if (this.socket) {
      this.socket.on('gameStateUpdated', callback);
    }
  }

  onPlayerReconnected(callback: EventCallback): void {
    if (this.socket) {
      this.socket.on('playerReconnected', callback);
    }
  }

  onPlayerDisconnected(callback: EventCallback): void {
    if (this.socket) {
      this.socket.on('playerDisconnected', callback);
    }
  }

  onConnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  onDisconnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  onReconnecting(callback: EventCallback): void {
    if (this.socket) {
      this.socket.on('reconnect_attempt', callback);
    }
  }

  onReconnectFailed(callback: EventCallback): void {
    if (this.socket) {
      this.socket.on('reconnect_failed', callback);
    }
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    if (this.socket) {
      this.socket.on('connect', () => callback('connected'));
      this.socket.on('disconnect', () => callback('disconnected'));
      this.socket.on('reconnect_attempt', () => callback('reconnecting'));
      this.socket.on('reconnect', () => callback('connected'));
    }
  }

  // Remove listeners
  off(event: string, callback?: EventCallback): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get current reconnection attempt count
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();

// Export class for testing
export { SocketManager };
