/**
 * Bot Executor
 * Handles automatic bot move execution during gameplay
 */

import { Server as SocketIOServer } from 'socket.io';
import { GameState, Card } from '../../src/types';
import { RoomManager } from '../managers/RoomManager';
import { GameStateManager } from '../managers/GameStateManager';
import { isBot, botSelectPhase1Card, botSelectPhase2Cards, getBotDelay } from './botAI';
import { filterGameStateForPlayer } from './stateFilter';
import { securityLogger } from './securityLogger';

/**
 * Checks if it's a bot's turn and schedules bot move execution
 * @param io - Socket.io server instance for broadcasting
 * @param roomManager - Room manager instance
 * @param gameStateManager - Game state manager instance
 * @param roomId - ID of the room to check
 * @param socketToPlayer - Map of socket IDs to player info for filtered broadcasting
 */
export function checkAndExecuteBotTurn(
  io: SocketIOServer,
  roomManager: RoomManager,
  gameStateManager: GameStateManager,
  roomId: string,
  socketToPlayer?: Map<string, { roomId: string; playerId: string }>
): void {
  const room = roomManager.getRoom(roomId);
  
  if (!room) {
    return;
  }

  const gameState = room.gameState;
  
  // Only execute bot turns during active gameplay phases
  if (gameState.phase !== 'BERIZ' && gameState.phase !== 'JHABBU') {
    return;
  }

  // Check if current player is a bot
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  if (!currentPlayer || !isBot(currentPlayer.id)) {
    return;
  }

  // Schedule bot move with delay for realistic gameplay
  const delay = getBotDelay();
  
  setTimeout(() => {
    executeBotMove(io, roomManager, gameStateManager, roomId, socketToPlayer);
  }, delay);
}

/**
 * Executes a bot move for the current player
 * @param io - Socket.io server instance for broadcasting
 * @param roomManager - Room manager instance
 * @param gameStateManager - Game state manager instance
 * @param roomId - ID of the room
 * @param socketToPlayer - Map of socket IDs to player info for filtered broadcasting
 */
function executeBotMove(
  io: SocketIOServer,
  roomManager: RoomManager,
  gameStateManager: GameStateManager,
  roomId: string,
  socketToPlayer?: Map<string, { roomId: string; playerId: string }>
): void {
  const room = roomManager.getRoom(roomId);
  
  if (!room) {
    console.error(`Bot executor: Room ${roomId} not found`);
    return;
  }

  const gameState = room.gameState;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Verify it's still a bot's turn (game state might have changed)
  if (!currentPlayer || !isBot(currentPlayer.id)) {
    return;
  }

  // Verify game is still in active phase
  if (gameState.phase !== 'BERIZ' && gameState.phase !== 'JHABBU') {
    return;
  }

  try {
    let cardsToPlay: Card[];

    // Select cards based on game phase
    if (gameState.phase === 'BERIZ') {
      const card = botSelectPhase1Card(currentPlayer, gameState);
      cardsToPlay = [card];
    } else {
      cardsToPlay = botSelectPhase2Cards(currentPlayer, gameState);
    }

    // Process the bot's move
    const result = gameStateManager.processCardPlay(
      gameState,
      currentPlayer.id,
      cardsToPlay
    );

    if (!result.success) {
      console.error(`Bot move failed for ${currentPlayer.id}: ${result.error}`);
      return;
    }

    // Update room state
    room.gameState = result.newGameState;
    room.lastActivity = new Date();

    console.log(`Bot ${currentPlayer.id} played cards in room ${roomId}`);

    securityLogger.log({
      event: 'Bot played cards',
      roomId,
      playerId: currentPlayer.id,
      details: `${cardsToPlay.length} card(s), event: ${result.event}`,
      severity: 'info'
    });

    // Broadcast filtered state to each player if we have socket mapping (send once per player)
    if (socketToPlayer) {
      const broadcastedPlayers = new Set<string>();
      
      for (const player of result.newGameState.players) {
        // Skip if we already broadcast to this player
        if (broadcastedPlayers.has(player.id)) {
          continue;
        }
        
        const filteredState = filterGameStateForPlayer(result.newGameState, player.id);
        
        // Find sockets for this player in this room
        const playerSockets = Array.from(socketToPlayer.entries())
          .filter(([_, info]) => info.playerId === player.id && info.roomId === roomId)
          .map(([socketId, _]) => socketId);
        
        playerSockets.forEach(socketId => {
          io.to(socketId).emit('gameStateUpdated', {
            gameState: filteredState,
            event: result.event
          });
        });
        
        broadcastedPlayers.add(player.id);
      }
    } else {
      // Fallback: broadcast unfiltered (for backward compatibility)
      io.to(roomId).emit('gameStateUpdated', {
        gameState: result.newGameState,
        event: result.event
      });
    }

    // Check if next player is also a bot (recursive bot execution)
    checkAndExecuteBotTurn(io, roomManager, gameStateManager, roomId, socketToPlayer);
    
  } catch (error) {
    console.error(`Error executing bot move for ${currentPlayer.id}:`, error);
  }
}
