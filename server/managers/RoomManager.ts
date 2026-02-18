import { GameState, Player } from '../types';

export interface Spectator {
  id: string;
  name: string;
  sessionId: string;
  joinedAt: Date;
}

export interface Room {
  id: string;
  hostId: string;
  maxPlayers: number;
  gameState: GameState;
  sessions: Map<string, string>; // sessionId -> playerId
  disconnectedPlayers: Map<string, Date>; // playerId -> disconnectTime
  spectators: Spectator[]; // Players watching the game
  createdAt: Date;
  lastActivity: Date;
  emptyAt: Date | null; // When the room became empty (null if not empty)
}

export class RoomManager {
  private rooms: Map<string, Room>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.rooms = new Map();
    this.cleanupInterval = null;
  }

  /**
   * Creates a new room with a unique ID
   * @param hostId - The ID of the player creating the room
   * @param maxPlayers - Maximum number of players allowed in the room
   * @returns The unique room ID
   */
  createRoom(hostId: string, maxPlayers: number): string {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      hostId,
      maxPlayers,
      gameState: this.initializeGameState(roomId, hostId, maxPlayers),
      sessions: new Map(),
      disconnectedPlayers: new Map(),
      spectators: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      emptyAt: null
    };
    this.rooms.set(roomId, room);
    return roomId;
  }

  /**
   * Retrieves a room by its ID
   * @param roomId - The room ID to retrieve
   * @returns The room object or undefined if not found
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Deletes a room by its ID
   * @param roomId - The room ID to delete
   */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /**
   * Adds a player to a room
   * @param roomId - The room ID to join
   * @param playerId - The player's unique ID
   * @param playerName - The player's display name
   * @param sessionId - The session ID for reconnection
   * @returns true if player was added successfully, false otherwise
   */
  addPlayerToRoom(
    roomId: string,
    playerId: string,
    playerName: string,
    sessionId: string
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.gameState.players.length >= room.maxPlayers) return false;

    // Add player to game state
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      sideDeck: [],
      isActive: true,
      isHost: playerId === room.hostId,
      position: room.gameState.players.length
    };

    room.gameState.players.push(newPlayer);
    room.sessions.set(sessionId, playerId);
    room.lastActivity = new Date();
    
    // Room is no longer empty
    room.emptyAt = null;
    
    return true;
  }

  /**
   * Removes a player from a room
   * @param roomId - The room ID
   * @param playerId - The player ID to remove
   */
  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.gameState.players = room.gameState.players.filter(p => p.id !== playerId);
    
    // Remove session mapping
    for (const [sessionId, pId] of room.sessions.entries()) {
      if (pId === playerId) {
        room.sessions.delete(sessionId);
        break;
      }
    }

    // Transfer host if needed
    if (room.hostId === playerId && room.gameState.players.length > 0) {
      room.hostId = room.gameState.players[0].id;
      room.gameState.players[0].isHost = true;
      room.gameState.hostId = room.hostId;
    }

    // Mark room as empty if no players remain (will be deleted after 1 minute by cleanup task)
    if (room.gameState.players.length === 0) {
      room.emptyAt = new Date();
    }
  }

  /**
   * Gets the total number of active rooms
   * @returns The count of active rooms
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Starts the periodic cleanup task for inactive rooms
   */
  startCleanupTask(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      for (const [roomId, room] of this.rooms.entries()) {
        // Delete empty rooms after 1 minute
        if (room.emptyAt !== null) {
          const emptyDuration = now.getTime() - room.emptyAt.getTime();
          if (emptyDuration > 60 * 1000) { // 1 minute
            this.rooms.delete(roomId);
            continue;
          }
        }
        
        // Delete rooms inactive for 30 minutes
        const inactiveTime = now.getTime() - room.lastActivity.getTime();
        if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
          this.rooms.delete(roomId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Stops the cleanup task
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Marks a player as disconnected
   * @param roomId - The room ID
   * @param playerId - The player ID to mark as disconnected
   */
  markPlayerDisconnected(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.disconnectedPlayers.set(playerId, new Date());
  }

  /**
   * Marks a player as reconnected (removes from disconnected list)
   * @param roomId - The room ID
   * @param playerId - The player ID to mark as reconnected
   */
  markPlayerReconnected(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.disconnectedPlayers.delete(playerId);
  }

  /**
   * Checks if a player is currently disconnected
   * @param roomId - The room ID
   * @param playerId - The player ID to check
   * @returns true if player is disconnected, false otherwise
   */
  isPlayerDisconnected(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    return room.disconnectedPlayers.has(playerId);
  }

  /**
   * Adds a spectator to a room
   * @param roomId - The room ID
   * @param spectatorId - The spectator's unique ID
   * @param spectatorName - The spectator's display name
   * @param sessionId - The session ID for reconnection
   * @returns true if spectator was added successfully, false otherwise
   */
  addSpectatorToRoom(
    roomId: string,
    spectatorId: string,
    spectatorName: string,
    sessionId: string
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const spectator: Spectator = {
      id: spectatorId,
      name: spectatorName,
      sessionId,
      joinedAt: new Date()
    };

    room.spectators.push(spectator);
    room.lastActivity = new Date();
    
    return true;
  }

  /**
   * Removes a spectator from a room
   * @param roomId - The room ID
   * @param spectatorId - The spectator ID to remove
   */
  removeSpectatorFromRoom(roomId: string, spectatorId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.spectators = room.spectators.filter(s => s.id !== spectatorId);
  }

  /**
   * Checks if a session ID belongs to a spectator
   * @param roomId - The room ID
   * @param sessionId - The session ID to check
   * @returns The spectator ID if found, undefined otherwise
   */
  getSpectatorBySession(roomId: string, sessionId: string): string | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const spectator = room.spectators.find(s => s.sessionId === sessionId);
    return spectator?.id;
  }

  /**
   * Checks if the game is in progress (not in LOBBY or SETUP)
   * @param roomId - The room ID
   * @returns true if game is in progress, false otherwise
   */
  isGameInProgress(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    return room.gameState.phase === 'BERIZ' || 
           room.gameState.phase === 'JHABBU' || 
           room.gameState.phase === 'DEALING';
  }

  /**
   * Promotes spectators to players when a new game starts
   * @param roomId - The room ID
   * @returns Array of spectator IDs that were promoted
   */
  promoteSpectatorsToPlayers(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const promotedIds: string[] = [];
    const spectatorsToPromote = [...room.spectators];
    
    for (const spectator of spectatorsToPromote) {
      // Only promote if there's space
      if (room.gameState.players.length >= room.maxPlayers) {
        break;
      }

      // Add spectator as a player
      const added = this.addPlayerToRoom(
        roomId,
        spectator.id,
        spectator.name,
        spectator.sessionId
      );

      if (added) {
        promotedIds.push(spectator.id);
        // Remove from spectators
        this.removeSpectatorFromRoom(roomId, spectator.id);
      }
    }

    return promotedIds;
  }

  /**
   * Removes players who have been disconnected for more than the timeout period
   * @param roomId - The room ID
   * @param timeoutMs - Timeout in milliseconds (default: 5 minutes)
   */
  removeTimedOutPlayers(roomId: string, timeoutMs: number = 5 * 60 * 1000): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const now = new Date();
    const removedPlayers: string[] = [];

    for (const [playerId, disconnectTime] of room.disconnectedPlayers.entries()) {
      const disconnectedDuration = now.getTime() - disconnectTime.getTime();
      if (disconnectedDuration > timeoutMs) {
        this.removePlayerFromRoom(roomId, playerId);
        removedPlayers.push(playerId);
      }
    }

    return removedPlayers;
  }

  /**
   * Finds the room ID for a given socket ID
   * @param socketId - The socket ID to search for
   * @returns The room ID or undefined if not found
   */
  findRoomBySocketId(socketId: string): string | undefined {
    // This will be tracked in socketHandlers using a Map
    return undefined;
  }

  /**
   * Generates a unique 6-character alphanumeric room ID
   * @returns A unique room ID
   */
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId: string;
    do {
      roomId = Array.from({ length: 6 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    } while (this.rooms.has(roomId));
    return roomId;
  }

  /**
   * Initializes a new game state for a room
   * @param roomId - The room ID
   * @param hostId - The host player ID
   * @param maxPlayers - Maximum number of players
   * @returns A new GameState object
   */
  private initializeGameState(roomId: string, hostId: string, maxPlayers: number): GameState {
    return {
      phase: 'LOBBY',
      roomId,
      hostId,
      maxPlayers,
      players: [],
      currentPlayerIndex: 0,
      dealerId: '',
      table: [],
      leadSuit: null,
      trickCards: [],
      loser: null
    };
  }
}
