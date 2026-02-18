import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from '../managers/RoomManager';
import { GameStateManager } from '../managers/GameStateManager';
import { Card } from '../types';
import { checkAndExecuteBotTurn } from '../utils/botExecutor';
import { securityLogger } from '../utils/securityLogger';
import { globalRateLimiter } from '../utils/rateLimiter';
import { filterGameStateForPlayer, filterGameStateForSpectator } from '../utils/stateFilter';

/**
 * Generates a unique session ID for player reconnection
 * @returns A unique session ID string
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Rate limiting middleware for socket events
 * @param socket - The socket instance
 * @param eventName - Name of the event being rate limited
 * @returns true if request is allowed, false if rate limited
 */
function checkRateLimit(socket: Socket, eventName: string): boolean {
  const allowed = globalRateLimiter.checkLimit(socket.id);
  
  if (!allowed) {
    securityLogger.log({
      event: 'Rate limit exceeded',
      socketId: socket.id,
      details: `Event: ${eventName}`,
      severity: 'warning'
    });
  }
  
  return allowed;
}

/**
 * Sets up all Socket.io event handlers for the game server
 * @param io - The Socket.io server instance
 * @param roomManager - The room manager instance
 */
export function setupSocketHandlers(io: SocketIOServer, roomManager: RoomManager) {
  const gameStateManager = new GameStateManager();
  
  // Track socket to player/room mappings for disconnect handling
  const socketToPlayer = new Map<string, { roomId: string; playerId: string }>();
  
  // Track disconnection timeouts
  const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    /**
     * Create Room Event Handler
     * Creates a new game room with the requesting player as host
     */
    socket.on('createRoom', (data: { maxPlayers: number }, callback) => {
      // Rate limiting
      if (!checkRateLimit(socket, 'createRoom')) {
        callback({ success: false, error: 'Too many requests. Please try again later.' });
        return;
      }

      try {
        const sessionId = generateSessionId();
        const roomId = roomManager.createRoom(sessionId, data.maxPlayers);
        
        socket.join(roomId);
        console.log(`Room created: ${roomId} by ${sessionId}`);
        
        securityLogger.log({
          event: 'Room created',
          roomId,
          socketId: socket.id,
          severity: 'info'
        });
        
        callback({ success: true, roomId, sessionId });
      } catch (error) {
        console.error('Error creating room:', error);
        securityLogger.log({
          event: 'Room creation failed',
          socketId: socket.id,
          details: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error'
        });
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    /**
     * Join Room Event Handler
     * Allows a player to join an existing room or reconnect with a session ID
     * If game is in progress, joins as spectator instead
     */
    socket.on('joinRoom', (data: { roomId: string; playerName: string; sessionId?: string }, callback) => {
      // Rate limiting
      if (!checkRateLimit(socket, 'joinRoom')) {
        callback({ success: false, error: 'Too many requests. Please try again later.' });
        return;
      }

      try {
        const room = roomManager.getRoom(data.roomId);
        
        if (!room) {
          securityLogger.log({
            event: 'Join attempt - room not found',
            roomId: data.roomId,
            socketId: socket.id,
            severity: 'warning'
          });
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Check if reconnecting with existing session
        if (data.sessionId && room.sessions.has(data.sessionId)) {
          const playerId = room.sessions.get(data.sessionId)!;
          socket.join(data.roomId);
          
          // Track socket to player mapping
          socketToPlayer.set(socket.id, { roomId: data.roomId, playerId });
          
          // Mark player as reconnected
          roomManager.markPlayerReconnected(data.roomId, playerId);
          
          // Clear any pending disconnect timeout
          const timeoutKey = `${data.roomId}:${playerId}`;
          if (disconnectTimeouts.has(timeoutKey)) {
            clearTimeout(disconnectTimeouts.get(timeoutKey)!);
            disconnectTimeouts.delete(timeoutKey);
          }
          
          console.log(`Player reconnected: ${playerId} to room ${data.roomId}`);
          
          securityLogger.log({
            event: 'Player reconnected',
            roomId: data.roomId,
            playerId,
            socketId: socket.id,
            severity: 'info'
          });
          
          // Filter game state for this player
          const filteredState = filterGameStateForPlayer(room.gameState, playerId);
          
          callback({ 
            success: true, 
            sessionId: data.sessionId,
            playerId,
            gameState: filteredState,
            isSpectator: false
          });
          
          io.to(data.roomId).emit('playerReconnected', { playerId });
          return;
        }

        // Check if reconnecting as spectator
        if (data.sessionId) {
          const spectatorId = roomManager.getSpectatorBySession(data.roomId, data.sessionId);
          if (spectatorId) {
            socket.join(data.roomId);
            
            console.log(`Spectator reconnected: ${spectatorId} to room ${data.roomId}`);
            
            securityLogger.log({
              event: 'Spectator reconnected',
              roomId: data.roomId,
              playerId: spectatorId,
              socketId: socket.id,
              severity: 'info'
            });
            
            // Spectators see all hands hidden
            const filteredState = filterGameStateForSpectator(room.gameState);
            
            callback({ 
              success: true, 
              sessionId: data.sessionId,
              playerId: spectatorId,
              gameState: filteredState,
              isSpectator: true
            });
            
            return;
          }
        }

        // Check if game is in progress - join as spectator
        const gameInProgress = roomManager.isGameInProgress(data.roomId);
        
        if (gameInProgress) {
          const sessionId = data.sessionId || generateSessionId();
          const spectatorId = `spectator-${Date.now()}-${Math.random()}`;
          
          const added = roomManager.addSpectatorToRoom(data.roomId, spectatorId, data.playerName, sessionId);
          
          if (!added) {
            callback({ success: false, error: 'Failed to join as spectator' });
            return;
          }

          socket.join(data.roomId);
          console.log(`Spectator joined: ${spectatorId} (${data.playerName}) to room ${data.roomId}`);
          
          securityLogger.log({
            event: 'Spectator joined',
            roomId: data.roomId,
            playerId: spectatorId,
            socketId: socket.id,
            details: `Name: ${data.playerName}`,
            severity: 'info'
          });
          
          const updatedRoom = roomManager.getRoom(data.roomId)!;
          
          // Spectators see all hands hidden
          const filteredState = filterGameStateForSpectator(updatedRoom.gameState);
          
          callback({ 
            success: true, 
            sessionId,
            playerId: spectatorId,
            gameState: filteredState,
            isSpectator: true
          });

          // Broadcast spectator join to all players
          io.to(data.roomId).emit('spectatorJoined', { 
            spectator: updatedRoom.spectators.find(s => s.id === spectatorId),
            spectators: updatedRoom.spectators
          });
          
          return;
        }

        // New player joining (game not in progress)
        const sessionId = data.sessionId || generateSessionId();
        const playerId = `player-${Date.now()}-${Math.random()}`;
        
        const added = roomManager.addPlayerToRoom(data.roomId, playerId, data.playerName, sessionId);
        
        if (!added) {
          securityLogger.log({
            event: 'Join attempt - room full',
            roomId: data.roomId,
            socketId: socket.id,
            severity: 'warning'
          });
          callback({ success: false, error: 'Room is full' });
          return;
        }

        socket.join(data.roomId);
        console.log(`Player joined: ${playerId} (${data.playerName}) to room ${data.roomId}`);
        
        // Track socket to player mapping
        socketToPlayer.set(socket.id, { roomId: data.roomId, playerId });
        
        securityLogger.log({
          event: 'Player joined',
          roomId: data.roomId,
          playerId,
          socketId: socket.id,
          details: `Name: ${data.playerName}`,
          severity: 'info'
        });
        
        const updatedRoom = roomManager.getRoom(data.roomId)!;
        
        // Filter game state for this player
        const filteredState = filterGameStateForPlayer(updatedRoom.gameState, playerId);
        
        callback({ 
          success: true, 
          sessionId,
          playerId,
          gameState: filteredState,
          isSpectator: false
        });

        // Broadcast to all players in room - each gets their own filtered state
        for (const player of updatedRoom.gameState.players) {
          const playerFilteredState = filterGameStateForPlayer(updatedRoom.gameState, player.id);
          io.to(data.roomId).emit('playerJoined', { 
            player: updatedRoom.gameState.players.find(p => p.id === playerId),
            players: playerFilteredState.players 
          });
        }
      } catch (error) {
        console.error('Error joining room:', error);
        securityLogger.log({
          event: 'Join room failed',
          roomId: data.roomId,
          socketId: socket.id,
          details: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error'
        });
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    /**
     * Start Game Event Handler
     * Starts the game if requested by the host and minimum players are present
     */
    socket.on('startGame', (data: { roomId: string; playerId: string }, callback) => {
      // Rate limiting
      if (!checkRateLimit(socket, 'startGame')) {
        callback({ success: false, error: 'Too many requests. Please try again later.' });
        return;
      }

      try {
        const room = roomManager.getRoom(data.roomId);
        
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Check if player is a spectator
        const isSpectator = room.spectators.some(s => s.id === data.playerId);
        if (isSpectator) {
          securityLogger.log({
            event: 'Spectator attempted to start game',
            roomId: data.roomId,
            playerId: data.playerId,
            socketId: socket.id,
            severity: 'warning'
          });
          callback({ success: false, error: 'Spectators cannot start the game' });
          return;
        }

        // Verify requester is the host
        if (room.hostId !== data.playerId) {
          securityLogger.log({
            event: 'Unauthorized start game attempt',
            roomId: data.roomId,
            playerId: data.playerId,
            socketId: socket.id,
            details: `Player ${data.playerId} is not host (host is ${room.hostId})`,
            severity: 'warning'
          });
          callback({ success: false, error: 'Only host can start game' });
          return;
        }

        // Verify minimum player count (at least 2 players)
        if (room.gameState.players.length < 2) {
          callback({ success: false, error: 'Need at least 2 players to start' });
          return;
        }

        // Start game using GameStateManager
        const newGameState = gameStateManager.startGame(room.gameState);
        room.gameState = newGameState;
        room.lastActivity = new Date();

        console.log(`Game started in room ${data.roomId} by host ${data.playerId}`);
        
        securityLogger.log({
          event: 'Game started',
          roomId: data.roomId,
          playerId: data.playerId,
          details: `${room.gameState.players.length} players`,
          severity: 'info'
        });
        
        callback({ success: true });
        
        // Broadcast filtered state to each player
        for (const player of newGameState.players) {
          const filteredState = filterGameStateForPlayer(newGameState, player.id);
          // Send to specific player's socket
          const playerSockets = Array.from(socketToPlayer.entries())
            .filter(([_, info]) => info.playerId === player.id && info.roomId === data.roomId)
            .map(([socketId, _]) => socketId);
          
          playerSockets.forEach(socketId => {
            io.to(socketId).emit('gameStarted', { gameState: filteredState });
          });
        }
        
        // Broadcast to spectators with all hands hidden
        if (room.spectators.length > 0) {
          const spectatorState = filterGameStateForSpectator(newGameState);
          for (const spectator of room.spectators) {
            io.to(data.roomId).emit('gameStarted', { gameState: spectatorState });
          }
        }
        
        // Check if first player is a bot and execute their turn
        checkAndExecuteBotTurn(io, roomManager, gameStateManager, data.roomId, socketToPlayer);
      } catch (error) {
        console.error('Error starting game:', error);
        securityLogger.log({
          event: 'Start game failed',
          roomId: data.roomId,
          playerId: data.playerId,
          socketId: socket.id,
          details: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error'
        });
        callback({ success: false, error: 'Failed to start game' });
      }
    });

    /**
     * Play Card Event Handler
     * Validates and processes a card play, then broadcasts the updated state
     */
    socket.on('playCard', (data: { roomId: string; playerId: string; cards: Card[] }, callback) => {
      // Rate limiting
      if (!checkRateLimit(socket, 'playCard')) {
        callback({ success: false, error: 'Too many requests. Please try again later.' });
        return;
      }

      try {
        const room = roomManager.getRoom(data.roomId);
        
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Check if player is a spectator
        const isSpectator = room.spectators.some(s => s.id === data.playerId);
        if (isSpectator) {
          securityLogger.log({
            event: 'Spectator attempted to play card',
            roomId: data.roomId,
            playerId: data.playerId,
            socketId: socket.id,
            severity: 'warning'
          });
          callback({ success: false, error: 'Spectators cannot make moves' });
          return;
        }

        // Validate and process move using GameStateManager
        const result = gameStateManager.processCardPlay(
          room.gameState,
          data.playerId,
          data.cards
        );

        if (!result.success) {
          securityLogger.log({
            event: 'Invalid card play attempt',
            roomId: data.roomId,
            playerId: data.playerId,
            socketId: socket.id,
            details: result.error || 'Unknown validation error',
            severity: 'warning'
          });
          callback({ success: false, error: result.error });
          return;
        }

        room.gameState = result.newGameState;
        room.lastActivity = new Date();

        console.log(`Card played by ${data.playerId} in room ${data.roomId}`);
        
        securityLogger.log({
          event: 'Card played',
          roomId: data.roomId,
          playerId: data.playerId,
          details: `${data.cards.length} card(s), event: ${result.event}`,
          severity: 'info'
        });
        
        callback({ success: true });
        
        // Broadcast filtered state to each player
        for (const player of result.newGameState.players) {
          const filteredState = filterGameStateForPlayer(result.newGameState, player.id);
          // Send to specific player's socket
          const playerSockets = Array.from(socketToPlayer.entries())
            .filter(([_, info]) => info.playerId === player.id && info.roomId === data.roomId)
            .map(([socketId, _]) => socketId);
          
          playerSockets.forEach(socketId => {
            io.to(socketId).emit('gameStateUpdated', { 
              gameState: filteredState,
              event: result.event
            });
          });
        }
        
        // Broadcast to spectators with all hands hidden
        if (room.spectators.length > 0) {
          const spectatorState = filterGameStateForSpectator(result.newGameState);
          for (const spectator of room.spectators) {
            io.to(data.roomId).emit('gameStateUpdated', { 
              gameState: spectatorState,
              event: result.event
            });
          }
        }
        
        // Check if next player is a bot and execute their turn
        checkAndExecuteBotTurn(io, roomManager, gameStateManager, data.roomId, socketToPlayer);
      } catch (error) {
        console.error('Error playing card:', error);
        securityLogger.log({
          event: 'Play card failed',
          roomId: data.roomId,
          playerId: data.playerId,
          socketId: socket.id,
          details: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error'
        });
        callback({ success: false, error: 'Failed to play card' });
      }
    });

    /**
     * Add Bot Event Handler
     * Adds a bot player to the room (host only)
     */
    socket.on('addBot', (data: { roomId: string; playerId: string }, callback) => {
      // Rate limiting
      if (!checkRateLimit(socket, 'addBot')) {
        callback({ success: false, error: 'Too many requests. Please try again later.' });
        return;
      }

      try {
        const room = roomManager.getRoom(data.roomId);
        
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Verify requester is the host
        if (room.hostId !== data.playerId) {
          securityLogger.log({
            event: 'Unauthorized add bot attempt',
            roomId: data.roomId,
            playerId: data.playerId,
            socketId: socket.id,
            details: `Player ${data.playerId} is not host`,
            severity: 'warning'
          });
          callback({ success: false, error: 'Only host can add bots' });
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

        console.log(`Bot added: ${botId} to room ${data.roomId}`);
        
        securityLogger.log({
          event: 'Bot added',
          roomId: data.roomId,
          playerId: data.playerId,
          details: `Bot ID: ${botId}`,
          severity: 'info'
        });
        
        const updatedRoom = roomManager.getRoom(data.roomId)!;
        
        callback({ success: true });
        
        // Broadcast to all players - each gets their own filtered state
        for (const player of updatedRoom.gameState.players) {
          const filteredState = filterGameStateForPlayer(updatedRoom.gameState, player.id);
          const playerSockets = Array.from(socketToPlayer.entries())
            .filter(([_, info]) => info.playerId === player.id && info.roomId === data.roomId)
            .map(([socketId, _]) => socketId);
          
          playerSockets.forEach(socketId => {
            io.to(socketId).emit('playerJoined', { 
              player: updatedRoom.gameState.players.find(p => p.id === botId),
              players: filteredState.players 
            });
          });
        }
      } catch (error) {
        console.error('Error adding bot:', error);
        securityLogger.log({
          event: 'Add bot failed',
          roomId: data.roomId,
          playerId: data.playerId,
          socketId: socket.id,
          details: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error'
        });
        callback({ success: false, error: 'Failed to add bot' });
      }
    });

    /**
     * Disconnect Event Handler
     * Handles player disconnection - marks player as disconnected and sets timeout for removal
     */
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up rate limiter entry
      globalRateLimiter.remove(socket.id);
      
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) {
        // Socket was not associated with any player/room
        return;
      }

      const { roomId, playerId } = playerInfo;
      const room = roomManager.getRoom(roomId);
      
      if (!room) {
        // Room no longer exists
        socketToPlayer.delete(socket.id);
        return;
      }

      // Mark player as disconnected
      roomManager.markPlayerDisconnected(roomId, playerId);
      
      console.log(`Player ${playerId} disconnected from room ${roomId}`);
      
      securityLogger.log({
        event: 'Player disconnected',
        roomId,
        playerId,
        socketId: socket.id,
        severity: 'info'
      });
      
      // Check if the disconnected player is the current turn player
      const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
      const isCurrentPlayer = currentPlayer && currentPlayer.id === playerId;
      
      // Broadcast disconnection to other players
      io.to(roomId).emit('playerDisconnected', { 
        playerId,
        pauseGame: isCurrentPlayer && (room.gameState.phase === 'BERIZ' || room.gameState.phase === 'JHABBU')
      });
      
      // Set timeout to remove player after 5 minutes
      const timeoutKey = `${roomId}:${playerId}`;
      const timeout = setTimeout(() => {
        console.log(`Removing player ${playerId} from room ${roomId} due to timeout`);
        
        securityLogger.log({
          event: 'Player removed due to timeout',
          roomId,
          playerId,
          severity: 'info'
        });
        
        // Remove player from room
        roomManager.removePlayerFromRoom(roomId, playerId);
        
        // Broadcast player removal
        const updatedRoom = roomManager.getRoom(roomId);
        if (updatedRoom) {
          io.to(roomId).emit('playerRemoved', { 
            playerId,
            players: updatedRoom.gameState.players 
          });
        }
        
        disconnectTimeouts.delete(timeoutKey);
      }, 5 * 60 * 1000); // 5 minutes
      
      disconnectTimeouts.set(timeoutKey, timeout);
      socketToPlayer.delete(socket.id);
    });
  });
}
