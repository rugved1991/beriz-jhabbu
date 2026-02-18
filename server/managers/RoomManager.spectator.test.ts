/**
 * Unit tests for spectator functionality in RoomManager
 */

import { RoomManager } from './RoomManager';

describe('RoomManager - Spectator Support', () => {
  let roomManager: RoomManager;
  let roomId: string;

  beforeEach(() => {
    roomManager = new RoomManager();
    roomId = roomManager.createRoom('host-1', 4);
  });

  describe('addSpectatorToRoom', () => {
    it('should add a spectator to a room', () => {
      const added = roomManager.addSpectatorToRoom(
        roomId,
        'spectator-1',
        'Spectator 1',
        'session-spec-1'
      );

      expect(added).toBe(true);
      const room = roomManager.getRoom(roomId);
      expect(room?.spectators).toHaveLength(1);
      expect(room?.spectators[0].id).toBe('spectator-1');
      expect(room?.spectators[0].name).toBe('Spectator 1');
    });

    it('should return false for non-existent room', () => {
      const added = roomManager.addSpectatorToRoom(
        'INVALID',
        'spectator-1',
        'Spectator 1',
        'session-spec-1'
      );

      expect(added).toBe(false);
    });

    it('should allow multiple spectators', () => {
      roomManager.addSpectatorToRoom(roomId, 'spectator-1', 'Spectator 1', 'session-1');
      roomManager.addSpectatorToRoom(roomId, 'spectator-2', 'Spectator 2', 'session-2');
      roomManager.addSpectatorToRoom(roomId, 'spectator-3', 'Spectator 3', 'session-3');

      const room = roomManager.getRoom(roomId);
      expect(room?.spectators).toHaveLength(3);
    });
  });

  describe('removeSpectatorFromRoom', () => {
    beforeEach(() => {
      roomManager.addSpectatorToRoom(roomId, 'spectator-1', 'Spectator 1', 'session-1');
      roomManager.addSpectatorToRoom(roomId, 'spectator-2', 'Spectator 2', 'session-2');
    });

    it('should remove a spectator from a room', () => {
      roomManager.removeSpectatorFromRoom(roomId, 'spectator-1');

      const room = roomManager.getRoom(roomId);
      expect(room?.spectators).toHaveLength(1);
      expect(room?.spectators[0].id).toBe('spectator-2');
    });

    it('should handle removing non-existent spectator gracefully', () => {
      roomManager.removeSpectatorFromRoom(roomId, 'non-existent');

      const room = roomManager.getRoom(roomId);
      expect(room?.spectators).toHaveLength(2);
    });

    it('should handle non-existent room gracefully', () => {
      expect(() => {
        roomManager.removeSpectatorFromRoom('INVALID', 'spectator-1');
      }).not.toThrow();
    });
  });

  describe('getSpectatorBySession', () => {
    beforeEach(() => {
      roomManager.addSpectatorToRoom(roomId, 'spectator-1', 'Spectator 1', 'session-spec-1');
      roomManager.addSpectatorToRoom(roomId, 'spectator-2', 'Spectator 2', 'session-spec-2');
    });

    it('should return spectator ID for valid session', () => {
      const spectatorId = roomManager.getSpectatorBySession(roomId, 'session-spec-1');
      expect(spectatorId).toBe('spectator-1');
    });

    it('should return undefined for invalid session', () => {
      const spectatorId = roomManager.getSpectatorBySession(roomId, 'invalid-session');
      expect(spectatorId).toBeUndefined();
    });

    it('should return undefined for non-existent room', () => {
      const spectatorId = roomManager.getSpectatorBySession('INVALID', 'session-spec-1');
      expect(spectatorId).toBeUndefined();
    });
  });

  describe('isGameInProgress', () => {
    it('should return false for LOBBY phase', () => {
      const room = roomManager.getRoom(roomId);
      expect(room?.gameState.phase).toBe('LOBBY');
      expect(roomManager.isGameInProgress(roomId)).toBe(false);
    });

    it('should return true for BERIZ phase', () => {
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.gameState.phase = 'BERIZ';
      }
      expect(roomManager.isGameInProgress(roomId)).toBe(true);
    });

    it('should return true for JHABBU phase', () => {
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.gameState.phase = 'JHABBU';
      }
      expect(roomManager.isGameInProgress(roomId)).toBe(true);
    });

    it('should return true for DEALING phase', () => {
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.gameState.phase = 'DEALING';
      }
      expect(roomManager.isGameInProgress(roomId)).toBe(true);
    });

    it('should return false for GAME_OVER phase', () => {
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.gameState.phase = 'GAME_OVER';
      }
      expect(roomManager.isGameInProgress(roomId)).toBe(false);
    });

    it('should return false for non-existent room', () => {
      expect(roomManager.isGameInProgress('INVALID')).toBe(false);
    });
  });

  describe('promoteSpectatorsToPlayers', () => {
    beforeEach(() => {
      // Add 2 players to the room (max is 4)
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-p1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-p2');
      
      // Add 3 spectators
      roomManager.addSpectatorToRoom(roomId, 'spectator-1', 'Spectator 1', 'session-s1');
      roomManager.addSpectatorToRoom(roomId, 'spectator-2', 'Spectator 2', 'session-s2');
      roomManager.addSpectatorToRoom(roomId, 'spectator-3', 'Spectator 3', 'session-s3');
    });

    it('should promote spectators to players when space available', () => {
      const promotedIds = roomManager.promoteSpectatorsToPlayers(roomId);

      expect(promotedIds).toHaveLength(2); // Only 2 spots available
      expect(promotedIds).toContain('spectator-1');
      expect(promotedIds).toContain('spectator-2');

      const room = roomManager.getRoom(roomId);
      expect(room?.gameState.players).toHaveLength(4); // 2 original + 2 promoted
      expect(room?.spectators).toHaveLength(1); // 1 spectator remains
      expect(room?.spectators[0].id).toBe('spectator-3');
    });

    it('should promote all spectators if enough space', () => {
      // Remove one player to make more space
      roomManager.removePlayerFromRoom(roomId, 'player-2');

      const promotedIds = roomManager.promoteSpectatorsToPlayers(roomId);

      expect(promotedIds).toHaveLength(3); // All 3 spectators promoted
      const room = roomManager.getRoom(roomId);
      expect(room?.gameState.players).toHaveLength(4); // 1 original + 3 promoted
      expect(room?.spectators).toHaveLength(0); // No spectators remain
    });

    it('should not promote spectators if room is full', () => {
      // Fill the room
      roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-p3');
      roomManager.addPlayerToRoom(roomId, 'player-4', 'Player 4', 'session-p4');

      const promotedIds = roomManager.promoteSpectatorsToPlayers(roomId);

      expect(promotedIds).toHaveLength(0);
      const room = roomManager.getRoom(roomId);
      expect(room?.gameState.players).toHaveLength(4);
      expect(room?.spectators).toHaveLength(3); // All spectators remain
    });

    it('should return empty array for non-existent room', () => {
      const promotedIds = roomManager.promoteSpectatorsToPlayers('INVALID');
      expect(promotedIds).toEqual([]);
    });

    it('should return empty array if no spectators', () => {
      // Remove all spectators
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.spectators = [];
      }

      const promotedIds = roomManager.promoteSpectatorsToPlayers(roomId);
      expect(promotedIds).toEqual([]);
    });
  });
});
