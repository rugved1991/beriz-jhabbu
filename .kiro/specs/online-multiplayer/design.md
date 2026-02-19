# Design Document: Online Multiplayer for Beriz Jhabbu

## Overview

This design transforms Beriz Jhabbu from a local multiplayer game into a true online multiplayer experience. The architecture follows a client-server model where a Node.js backend manages game state and synchronizes it across multiple browser clients using WebSocket connections via Socket.io.

The design preserves all existing game logic and UI components while adding a network layer that enables real-time gameplay across different devices. The server acts as the single source of truth, validating all moves and broadcasting state updates to connected clients.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  React Client   │      (Socket.io)           │   Node.js       │
│   (Browser)     │                            │   Server        │
│                 │                            │                 │
└─────────────────┘                            └─────────────────┘
        │                                              │
        │                                              │
        ▼                                              ▼
┌─────────────────┐                            ┌─────────────────┐
│  Local State    │                            │  Room Manager   │
│  - UI State     │                            │  - Active Rooms │
│  - Animations   │                            │  - Game States  │
└─────────────────┘                            └─────────────────┘
```

### Component Architecture

**Backend (Node.js + Express + Socket.io)**
- HTTP Server: Serves static files and health checks
- WebSocket Server: Handles real-time game communication
- Room Manager: Manages active game rooms and their lifecycle
- Game State Manager: Maintains authoritative game state
- Event Handlers: Process client events and validate moves
- Bot AI Executor: Runs bot logic server-side

**Frontend (React + Socket.io Client)**
- Socket Manager: Manages WebSocket connection and reconnection
- Game State Sync: Receives and applies server state updates
- Event Emitters: Sends player actions to server
- UI Components: Existing components with minimal modifications
- Local State: Manages UI-only state (animations, selections)

### Data Flow

1. **Player Action**: User clicks a card in the UI
2. **Event Emission**: Client emits "playCard" event to server
3. **Server Validation**: Server validates the move against game rules
4. **State Update**: Server updates authoritative game state
5. **Broadcast**: Server broadcasts updated state to all clients in room
6. **Client Update**: All clients receive and render the new state

## Components and Interfaces

### Backend Components

#### 1. Server Entry Point (`server/index.ts`)

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from './managers/RoomManager';
import { setupSocketHandlers } from './handlers/socketHandlers';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

// Setup Socket.io event handlers
setupSocketHandlers(io, roomManager);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: roomManager.getRoomCount() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT);
```

#### 2. Room Manager (`server/managers/RoomManager.ts`)

```typescript
interface Room {
  id: string;
  hostId: string;
  maxPlayers: number;
  gameState: GameState;
  sessions: Map<string, string>; // sessionId -> playerId
  createdAt: Date;
  lastActivity: Date;
}

class RoomManager {
  private rooms: Map<string, Room>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.rooms = new Map();
    this.startCleanupTask();
  }

  createRoom(hostId: string, maxPlayers: number): string {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      hostId,
      maxPlayers,
      gameState: this.initializeGameState(roomId, hostId, maxPlayers),
      sessions: new Map(),
      createdAt: new Date(),
      lastActivity: new Date()
    };
    this.rooms.set(roomId, room);
    return roomId;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  addPlayerToRoom(roomId: string, playerId: string, playerName: string, sessionId: string): boolean {
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
    return true;
  }

  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.gameState.players = room.gameState.players.filter(p => p.id !== playerId);
    
    // Transfer host if needed
    if (room.hostId === playerId && room.gameState.players.length > 0) {
      room.hostId = room.gameState.players[0].id;
      room.gameState.players[0].isHost = true;
    }

    // Delete room if empty
    if (room.gameState.players.length === 0) {
      this.rooms.delete(roomId);
    }
  }

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

  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      for (const [roomId, room] of this.rooms.entries()) {
        const inactiveTime = now.getTime() - room.lastActivity.getTime();
        if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
          this.rooms.delete(roomId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}
```

#### 3. Socket Event Handlers (`server/handlers/socketHandlers.ts`)

```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from '../managers/RoomManager';
import { GameStateManager } from '../managers/GameStateManager';

export function setupSocketHandlers(io: SocketIOServer, roomManager: RoomManager) {
  const gameStateManager = new GameStateManager();

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Create room
    socket.on('createRoom', (data: { maxPlayers: number }, callback) => {
      const sessionId = generateSessionId();
      const roomId = roomManager.createRoom(sessionId, data.maxPlayers);
      
      socket.join(roomId);
      callback({ success: true, roomId, sessionId });
    });

    // Join room
    socket.on('joinRoom', (data: { roomId: string; playerName: string; sessionId?: string }, callback) => {
      const room = roomManager.getRoom(data.roomId);
      
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Check if reconnecting
      if (data.sessionId && room.sessions.has(data.sessionId)) {
        const playerId = room.sessions.get(data.sessionId)!;
        socket.join(data.roomId);
        callback({ 
          success: true, 
          sessionId: data.sessionId,
          playerId,
          gameState: room.gameState 
        });
        io.to(data.roomId).emit('playerReconnected', { playerId });
        return;
      }

      // New player joining
      const sessionId = data.sessionId || generateSessionId();
      const playerId = `player-${Date.now()}-${Math.random()}`;
      
      const added = roomManager.addPlayerToRoom(data.roomId, playerId, data.playerName, sessionId);
      
      if (!added) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      socket.join(data.roomId);
      callback({ 
        success: true, 
        sessionId,
        playerId,
        gameState: room.gameState 
      });

      // Broadcast to all players in room
      io.to(data.roomId).emit('playerJoined', { 
        player: room.gameState.players.find(p => p.id === playerId),
        players: room.gameState.players 
      });
    });

    // Start game
    socket.on('startGame', (data: { roomId: string; playerId: string }, callback) => {
      const room = roomManager.getRoom(data.roomId);
      
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.hostId !== data.playerId) {
        callback({ success: false, error: 'Only host can start game' });
        return;
      }

      // Start game using existing game logic
      const newGameState = gameStateManager.startGame(room.gameState);
      room.gameState = newGameState;
      room.lastActivity = new Date();

      callback({ success: true });
      io.to(data.roomId).emit('gameStarted', { gameState: newGameState });
    });

    // Play card
    socket.on('playCard', (data: { roomId: string; playerId: string; cards: Card[] }, callback) => {
      const room = roomManager.getRoom(data.roomId);
      
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Validate and process move
      const result = gameStateManager.processCardPlay(
        room.gameState,
        data.playerId,
        data.cards
      );

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      room.gameState = result.newGameState;
      room.lastActivity = new Date();

      callback({ success: true });
      io.to(data.roomId).emit('gameStateUpdated', { 
        gameState: result.newGameState,
        event: result.event // e.g., 'cardPlayed', 'trickComplete', 'jhabbuAnnouncement'
      });
    });

    // Add bot
    socket.on('addBot', (data: { roomId: string; playerId: string }, callback) => {
      const room = roomManager.getRoom(data.roomId);
      
      if (!room || room.hostId !== data.playerId) {
        callback({ success: false, error: 'Unauthorized' });
        return;
      }

      const botId = `bot-${Date.now()}`;
      const botName = `Bot ${room.gameState.players.length + 1}`;
      const sessionId = generateSessionId();
      
      const added = roomManager.addPlayerToRoom(data.roomId, botId, botName, sessionId);
      
      if (!added) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      callback({ success: true });
      io.to(data.roomId).emit('playerJoined', { 
        player: room.gameState.players.find(p => p.id === botId),
        players: room.gameState.players 
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Mark player as disconnected but keep in room for reconnection
    });
  });
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

#### 4. Game State Manager (`server/managers/GameStateManager.ts`)

```typescript
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

class GameStateManager {
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
      leadSuit: result.leadSuit
    };

    let event = 'cardPlayed';

    if (result.trickComplete && result.nextLeaderId) {
      const nextLeaderIndex = newState.players.findIndex(p => p.id === result.nextLeaderId);
      newState.currentPlayerIndex = nextLeaderIndex;
      newState.leadSuit = null;
      event = result.wasJhabbu ? 'jhabbuAnnouncement' : 'trickComplete';
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
```

### Frontend Components

#### 1. Socket Manager (`src/services/SocketManager.ts`)

```typescript
import { io, Socket } from 'socket.io-client';
import { GameState, Card } from '../types';

type EventCallback = (data: any) => void;

class SocketManager {
  private socket: Socket | null = null;
  private serverUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  connect(): void {
    this.socket = io(this.serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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
          reject(new Error(response.error));
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
          reject(new Error(response.error));
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
          reject(new Error(response.error));
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
          reject(new Error(response.error));
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
          reject(new Error(response.error));
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

  // Remove listeners
  off(event: string, callback?: EventCallback): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketManager = new SocketManager();
```

#### 2. Modified App Component (`src/App.tsx`)

The existing App.tsx will be modified to:
- Initialize SocketManager on mount
- Replace local game state management with server-synchronized state
- Emit events to server instead of updating state directly
- Listen for server events and update UI accordingly

Key changes:
```typescript
// Initialize socket connection
useEffect(() => {
  socketManager.connect();
  
  // Setup event listeners
  socketManager.onGameStateUpdated(({ gameState, event }) => {
    setGameState(gameState);
    
    if (event === 'jhabbuAnnouncement') {
      // Show Jhabbu announcement
    } else if (event === 'phaseTransition') {
      // Show phase transition
    }
  });

  socketManager.onPlayerJoined(({ players }) => {
    setGameState(prev => ({ ...prev, players }));
  });

  return () => {
    socketManager.disconnect();
  };
}, []);

// Modified handlePlayCard
const handlePlayCard = useCallback(async (cardOrCards: Card | Card[]) => {
  const cards = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards];
  
  try {
    await socketManager.playCard(gameState.roomId, currentUserId, cards);
    // State will be updated via onGameStateUpdated event
  } catch (error) {
    setCardPlayError(error.message);
  }
}, [gameState.roomId, currentUserId]);
```

## Data Models

### Server-Side Models

```typescript
// Room model (server-only)
interface Room {
  id: string;
  hostId: string;
  maxPlayers: number;
  gameState: GameState;
  sessions: Map<string, string>; // sessionId -> playerId
  disconnectedPlayers: Map<string, Date>; // playerId -> disconnectTime
  createdAt: Date;
  lastActivity: Date;
}

// Session model (server-only)
interface Session {
  id: string;
  playerId: string;
  roomId: string;
  createdAt: Date;
  lastSeen: Date;
}
```

### Shared Models

All existing types from `src/types/index.ts` are shared between client and server:
- GameState
- Player
- Card
- GamePhase
- etc.

### Socket Event Payloads

```typescript
// Client -> Server events
interface CreateRoomPayload {
  maxPlayers: number;
}

interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  sessionId?: string;
}

interface StartGamePayload {
  roomId: string;
  playerId: string;
}

interface PlayCardPayload {
  roomId: string;
  playerId: string;
  cards: Card[];
}

interface AddBotPayload {
  roomId: string;
  playerId: string;
}

// Server -> Client events
interface PlayerJoinedEvent {
  player: Player;
  players: Player[];
}

interface GameStartedEvent {
  gameState: GameState;
}

interface GameStateUpdatedEvent {
  gameState: GameState;
  event: 'cardPlayed' | 'trickComplete' | 'jhabbuAnnouncement' | 'phaseTransition' | 'gameOver';
}

interface PlayerReconnectedEvent {
  playerId: string;
}

interface PlayerDisconnectedEvent {
  playerId: string;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Room Isolation

*For any* two distinct rooms on the server, actions performed in one room should never affect the game state of the other room.

**Validates: Requirements 1.4**

### Property 2: Room ID Uniqueness

*For any* sequence of room creation requests, all generated room IDs should be unique.

**Validates: Requirements 2.1, 2.2**

### Property 3: Room Creator is Host

*For any* room creation, the player who created the room should be marked as the host in the room's game state.

**Validates: Requirements 2.3**

### Property 4: Room Configuration Persistence

*For any* room created with a maximum player count, retrieving that room should return the same maximum player count.

**Validates: Requirements 2.4**

### Property 5: Room Creation Returns ID

*For any* successful room creation request, the response should include a valid room ID.

**Validates: Requirements 2.5**

### Property 6: Initial Room Phase

*For any* newly created room, the game phase should be set to LOBBY.

**Validates: Requirements 2.6**

### Property 7: Successful Join Increases Player Count

*For any* non-full room, when a player successfully joins, the player count should increase by exactly one.

**Validates: Requirements 3.1**

### Property 8: Full Room Join Rejection

*For any* room at maximum capacity, attempting to join should return an error and not modify the room state.

**Validates: Requirements 3.2**

### Property 9: Player ID Uniqueness Within Room

*For any* room with multiple players, all player IDs within that room should be unique.

**Validates: Requirements 3.6**

### Property 10: Invalid Move Rejection

*For any* invalid card play (wrong turn, wrong card, etc.), the server should reject the move, return an error, and leave the game state unchanged.

**Validates: Requirements 4.5, 4.6, 6.5, 11.5**

### Property 11: Host Authorization for Game Start

*For any* room, only the host player should be able to successfully start the game; non-host players should receive an error.

**Validates: Requirements 5.2, 5.6**

### Property 12: Game Start Minimum Players

*For any* room with at least the minimum number of players (2), the host should be able to start the game successfully.

**Validates: Requirements 5.3**

### Property 13: Game Start Phase Transition

*For any* room where the game is started, the game phase should transition to DEALING.

**Validates: Requirements 5.4**

### Property 14: Turn Validation

*For any* card play attempt, if it's not the player's turn, the server should reject the move with an error.

**Validates: Requirements 6.2**

### Property 15: Valid Move State Update

*For any* valid card play, the game state should be updated to reflect the move (card removed from hand, added to table/trick, turn advanced).

**Validates: Requirements 6.4**

### Property 16: Move Validation Against Game Rules

*For any* card play, the server should validate that the card is in the player's hand and follows the current game rules (suit following, etc.).

**Validates: Requirements 11.1, 11.4**

### Property 17: Disconnect Preserves Player

*For any* player in a room, when they disconnect, they should remain in the room's player list (marked as disconnected).

**Validates: Requirements 7.1**

### Property 18: Reconnection Restores State

*For any* disconnected player with a valid session ID, reconnecting should restore their player state and return the current game state.

**Validates: Requirements 7.3, 7.4**

### Property 19: Current Player Disconnect Pauses Game

*For any* game in progress, when the current turn player disconnects, the game should pause (not advance turns).

**Validates: Requirements 7.6**

### Property 20: Room Deletion Cleanup

*For any* deleted room, attempting to retrieve that room should return null/undefined.

**Validates: Requirements 8.3**

### Property 21: Host Transfer on Leave

*For any* room with multiple players, when the host leaves, another player should be promoted to host.

**Validates: Requirements 8.4**

### Property 22: Message Format Validation

*For any* client message, the server should validate that required fields (roomId, playerId) are present before processing.

**Validates: Requirements 10.3, 10.6**

### Property 23: Request Acknowledgment

*For any* client request (join, play card, start game), the server should send a response indicating success or failure.

**Validates: Requirements 10.4**

### Property 24: Validation Error Messages

*For any* validation failure, the server should return a descriptive error message explaining why the request was rejected.

**Validates: Requirements 10.7**

### Property 25: Player Identity Verification

*For any* game action, the server should verify that the player ID matches an actual player in the room before processing.

**Validates: Requirements 11.2**

### Property 26: Hand Privacy

*For any* game state sent to a player, it should only include that player's hand, not other players' hands.

**Validates: Requirements 11.3**

### Property 27: Bot Addition Increases Player Count

*For any* non-full room, when the host adds a bot, the player count should increase by one and the new player should be marked as a bot.

**Validates: Requirements 13.1**

### Property 28: Bot Turn Automation

*For any* game where it's a bot's turn, the bot should automatically play a valid move without human intervention.

**Validates: Requirements 13.3**

### Property 29: Session ID Uniqueness

*For any* sequence of player joins, all generated session IDs should be unique.

**Validates: Requirements 15.1**

### Property 30: Session Validation

*For any* reconnection attempt with a valid session ID, the server should accept the reconnection and restore the player's state.

**Validates: Requirements 15.4**

### Property 31: Invalid Session Rejection

*For any* reconnection attempt with an invalid or expired session ID, the server should reject the reconnection with an error.

**Validates: Requirements 15.5**

### Property 32: Mid-Game Join Creates Spectator

*For any* room with a game in progress (phase is BERIZ, JHABBU, or GAME_OVER), when a new player joins, they should be added as a spectator, not an active player.

**Validates: Requirements 16.1**

### Property 33: Spectator Receives Game State

*For any* spectator joining a room, the server should send them the current complete game state.

**Validates: Requirements 16.2**

### Property 34: Spectator Move Rejection

*For any* spectator attempting to make a game move, the server should reject the move with an error.

**Validates: Requirements 16.5**

### Property 35: Spectator to Player Transition

*For any* spectator in a room, when the game ends and a new game starts, they should be able to join as an active player.

**Validates: Requirements 16.6**

## Error Handling

### Client-Side Error Handling

**Network Errors**:
- Display user-friendly messages for connection failures
- Show reconnecting indicator during reconnection attempts
- Display success message on successful reconnection
- Provide retry mechanism for failed operations

**Validation Errors**:
- Display specific error messages from server (e.g., "Not your turn", "Room is full")
- Clear error messages after successful action
- Prevent UI interactions during error states

**Timeout Handling**:
- Set reasonable timeouts for all server requests (5-10 seconds)
- Display timeout message if server doesn't respond
- Allow user to retry timed-out operations

### Server-Side Error Handling

**Input Validation**:
- Validate all incoming messages for required fields
- Validate data types and formats
- Return descriptive error messages for validation failures
- Log validation failures for security monitoring

**Game Logic Errors**:
- Catch and handle errors from existing game logic
- Return user-friendly error messages
- Maintain game state consistency on errors
- Log unexpected errors for debugging

**Resource Errors**:
- Handle room not found errors gracefully
- Handle player not found errors gracefully
- Prevent memory leaks from abandoned connections
- Clean up resources on errors

**Concurrency Handling**:
- Use proper locking/synchronization for room state updates
- Handle race conditions in move processing
- Ensure atomic state updates
- Prevent duplicate move processing

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Test specific room creation scenarios
- Test specific join/leave scenarios
- Test error messages for known failure cases
- Test integration between components

**Property Tests**: Verify universal properties across all inputs
- Test room ID uniqueness across many generations
- Test state isolation across many concurrent rooms
- Test move validation across many random game states
- Test reconnection across many disconnect/reconnect cycles

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Property-Based Testing Configuration

**Library**: Use `fast-check` (already in package.json) for property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: online-multiplayer, Property N: [property text]`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

describe('Online Multiplayer Properties', () => {
  it('Property 2: Room ID Uniqueness', () => {
    // Feature: online-multiplayer, Property 2: Room ID Uniqueness
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }), // number of rooms to create
        (roomCount) => {
          const roomIds = new Set<string>();
          const roomManager = new RoomManager();
          
          for (let i = 0; i < roomCount; i++) {
            const roomId = roomManager.createRoom(`host-${i}`, 4);
            roomIds.add(roomId);
          }
          
          // All room IDs should be unique
          return roomIds.size === roomCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 7: Successful Join Increases Player Count', () => {
    // Feature: online-multiplayer, Property 7: Successful Join Increases Player Count
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 8 }), // max players
        fc.integer({ min: 1, max: 7 }), // players to add
        (maxPlayers, playersToAdd) => {
          const roomManager = new RoomManager();
          const roomId = roomManager.createRoom('host', maxPlayers);
          const room = roomManager.getRoom(roomId)!;
          const initialCount = room.gameState.players.length;
          
          const actualPlayersToAdd = Math.min(playersToAdd, maxPlayers - initialCount);
          
          for (let i = 0; i < actualPlayersToAdd; i++) {
            roomManager.addPlayerToRoom(
              roomId, 
              `player-${i}`, 
              `Player ${i}`,
              `session-${i}`
            );
          }
          
          const finalRoom = roomManager.getRoom(roomId)!;
          return finalRoom.gameState.players.length === initialCount + actualPlayersToAdd;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

**Room Management**:
- Test room creation with various player counts
- Test room deletion scenarios
- Test host transfer edge cases
- Test room cleanup timing

**Player Management**:
- Test player join/leave flows
- Test bot addition
- Test spectator mode
- Test player reconnection

**Game State Synchronization**:
- Test state updates after moves
- Test phase transitions
- Test game over conditions
- Test bot move execution

**Error Scenarios**:
- Test all validation error paths
- Test network error handling
- Test timeout scenarios
- Test concurrent access scenarios

### Integration Testing

**End-to-End Flows**:
- Complete game flow from room creation to game over
- Reconnection during active game
- Multiple concurrent games
- Bot vs human gameplay

**WebSocket Communication**:
- Test all Socket.io events
- Test broadcast functionality
- Test room-based message routing
- Test connection/disconnection handling

### Testing Tools

- **Jest**: Unit test framework (already configured)
- **fast-check**: Property-based testing library (already in package.json)
- **Socket.io-client**: For testing WebSocket communication
- **Supertest**: For testing HTTP endpoints (health checks)

### Test Coverage Goals

- Minimum 80% code coverage for server logic
- 100% coverage of all Socket.io event handlers
- All 35 correctness properties implemented as property tests
- All error paths covered by unit tests


## Deployment Architecture

### Backend Hosting Options

The Node.js backend server can be deployed to various platforms. Here are the recommended options:

#### Option 1: Render (Recommended for MVP)

**Pros**:
- Free tier available for hobby projects
- Simple deployment from GitHub
- Automatic HTTPS
- WebSocket support included
- No credit card required for free tier

**Cons**:
- Free tier spins down after inactivity (cold starts)
- Limited to 512MB RAM on free tier

**Setup**:
1. Push backend code to GitHub repository
2. Connect Render to GitHub
3. Create new Web Service
4. Render auto-detects Node.js and builds
5. Set environment variables (PORT, CLIENT_URL)

#### Option 2: Railway

**Pros**:
- $5 free credit per month
- No cold starts
- Simple deployment
- Good WebSocket support

**Cons**:
- Requires credit card
- Costs after free credit exhausted

#### Option 3: Heroku

**Pros**:
- Well-documented
- Mature platform
- Good ecosystem

**Cons**:
- No free tier anymore (minimum $7/month)
- More expensive than alternatives

#### Option 4: DigitalOcean App Platform

**Pros**:
- Reliable infrastructure
- Good performance
- Predictable pricing ($5/month)

**Cons**:
- No free tier
- Requires credit card

#### Option 5: Self-Hosted (VPS)

**Pros**:
- Full control
- Can be cheaper for multiple projects
- No platform limitations

**Cons**:
- Requires server management
- Need to handle SSL certificates
- Need to configure reverse proxy (nginx)
- More complex setup

### Frontend Hosting

The React frontend can be deployed separately:

#### Option 1: Vercel (Recommended)

**Pros**:
- Free tier for personal projects
- Automatic deployments from GitHub
- Excellent performance (CDN)
- Zero configuration for React

**Cons**:
- Need to configure CORS for backend

#### Option 2: Netlify

**Pros**:
- Free tier available
- Simple deployment
- Good for static sites

**Cons**:
- Similar to Vercel, just another option

#### Option 3: GitHub Pages

**Pros**:
- Completely free
- Simple setup

**Cons**:
- Only for static sites
- Need to configure routing for SPA

### Recommended MVP Setup

For getting started quickly:

1. **Backend**: Deploy to Render (free tier)
   - Create `server` directory in project
   - Add `package.json` for server dependencies
   - Deploy to Render from GitHub
   - Note the backend URL (e.g., `https://beriz-jhabbu-api.onrender.com`)

2. **Frontend**: Deploy to Vercel (free tier)
   - Keep existing React app in root
   - Configure `REACT_APP_SERVER_URL` environment variable
   - Deploy to Vercel from GitHub
   - Frontend URL (e.g., `https://beriz-jhabbu.vercel.app`)

3. **Environment Variables**:
   - Backend: `CLIENT_URL=https://beriz-jhabbu.vercel.app`
   - Frontend: `REACT_APP_SERVER_URL=https://beriz-jhabbu-api.onrender.com`

### Project Structure for Deployment

```
beriz-jhabbu/
├── src/                    # React frontend
├── public/
├── server/                 # Node.js backend
│   ├── index.ts
│   ├── managers/
│   ├── handlers/
│   ├── package.json       # Server dependencies
│   └── tsconfig.json      # Server TypeScript config
├── package.json           # Frontend dependencies
└── README.md
```

### Environment Configuration

**Backend Environment Variables**:
```
PORT=3001                                    # Server port
CLIENT_URL=https://beriz-jhabbu.vercel.app  # Frontend URL for CORS
NODE_ENV=production                          # Environment
```

**Frontend Environment Variables**:
```
REACT_APP_SERVER_URL=https://beriz-jhabbu-api.onrender.com  # Backend URL
```

### CORS Configuration

The backend must allow requests from the frontend domain:

```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### Scaling Considerations

For the MVP with in-memory storage:
- Single server instance is sufficient
- Supports ~100 concurrent rooms
- No database required

For production scaling (future):
- Add Redis for shared state across multiple server instances
- Use Socket.io Redis adapter for multi-server WebSocket support
- Add database (PostgreSQL/MongoDB) for persistent storage
- Implement horizontal scaling with load balancer

### Monitoring and Logging

**Development**:
- Console logging for debugging
- Socket.io debug mode

**Production**:
- Use logging service (e.g., Logtail, Papertrail)
- Monitor server health endpoint
- Track error rates
- Monitor WebSocket connection counts

### Cost Estimate (MVP)

- Backend (Render free tier): $0/month
- Frontend (Vercel free tier): $0/month
- Total: $0/month

**Note**: Free tiers have limitations (cold starts, bandwidth limits) but are perfect for MVP and testing.
