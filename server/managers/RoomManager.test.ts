import { RoomManager } from './RoomManager';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  afterEach(() => {
    roomManager.stopCleanupTask();
  });

  describe('Room Creation', () => {
    it('should create a room with a unique ID', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      
      expect(roomId).toBeDefined();
      expect(roomId).toHaveLength(6);
      expect(roomId).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should create rooms with unique IDs', () => {
      const roomId1 = roomManager.createRoom('host-1', 4);
      const roomId2 = roomManager.createRoom('host-2', 4);
      
      expect(roomId1).not.toBe(roomId2);
    });

    it('should initialize room with LOBBY phase', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      const room = roomManager.getRoom(roomId);
      
      expect(room).toBeDefined();
      expect(room!.gameState.phase).toBe('LOBBY');
    });

    it('should set the creator as host', () => {
      const hostId = 'host-123';
      const roomId = roomManager.createRoom(hostId, 4);
      const room = roomManager.getRoom(roomId);
      
      expect(room).toBeDefined();
      expect(room!.hostId).toBe(hostId);
      expect(room!.gameState.hostId).toBe(hostId);
    });

    it('should store the max player count', () => {
      const maxPlayers = 6;
      const roomId = roomManager.createRoom('host-1', maxPlayers);
      const room = roomManager.getRoom(roomId);
      
      expect(room).toBeDefined();
      expect(room!.maxPlayers).toBe(maxPlayers);
      expect(room!.gameState.maxPlayers).toBe(maxPlayers);
    });
  });

  describe('Room Retrieval', () => {
    it('should retrieve an existing room', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      const room = roomManager.getRoom(roomId);
      
      expect(room).toBeDefined();
      expect(room!.id).toBe(roomId);
    });

    it('should return undefined for non-existent room', () => {
      const room = roomManager.getRoom('NONEXIST');
      
      expect(room).toBeUndefined();
    });
  });

  describe('Room Deletion', () => {
    it('should delete a room', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      expect(roomManager.getRoom(roomId)).toBeDefined();
      
      roomManager.deleteRoom(roomId);
      expect(roomManager.getRoom(roomId)).toBeUndefined();
    });

    it('should handle deleting non-existent room gracefully', () => {
      expect(() => roomManager.deleteRoom('NONEXIST')).not.toThrow();
    });
  });

  describe('Player Management', () => {
    it('should add a player to a room', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      const result = roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      expect(result).toBe(true);
      
      const room = roomManager.getRoom(roomId);
      expect(room!.gameState.players).toHaveLength(1);
      expect(room!.gameState.players[0].id).toBe('player-1');
      expect(room!.gameState.players[0].name).toBe('Player 1');
    });

    it('should assign unique player IDs within a room', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      
      const room = roomManager.getRoom(roomId);
      const playerIds = room!.gameState.players.map(p => p.id);
      const uniqueIds = new Set(playerIds);
      
      expect(uniqueIds.size).toBe(playerIds.length);
    });

    it('should reject adding player to full room', () => {
      const roomId = roomManager.createRoom('host-1', 2);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      
      const result = roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
      
      expect(result).toBe(false);
      
      const room = roomManager.getRoom(roomId);
      expect(room!.gameState.players).toHaveLength(2);
    });

    it('should reject adding player to non-existent room', () => {
      const result = roomManager.addPlayerToRoom('NONEXIST', 'player-1', 'Player 1', 'session-1');
      
      expect(result).toBe(false);
    });

    it('should remove a player from a room', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      
      roomManager.removePlayerFromRoom(roomId, 'player-1');
      
      const room = roomManager.getRoom(roomId);
      expect(room!.gameState.players).toHaveLength(1);
      expect(room!.gameState.players[0].id).toBe('player-2');
    });

    it('should transfer host when host leaves', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      
      roomManager.removePlayerFromRoom(roomId, 'host-1');
      
      const room = roomManager.getRoom(roomId);
      expect(room!.hostId).toBe('player-2');
      expect(room!.gameState.players[0].isHost).toBe(true);
    });

    it('should mark room as empty when last player leaves', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      roomManager.removePlayerFromRoom(roomId, 'player-1');
      
      const room = roomManager.getRoom(roomId);
      expect(room).toBeDefined();
      expect(room!.emptyAt).not.toBeNull();
      expect(room!.gameState.players).toHaveLength(0);
    });

    it('should handle removing player from non-existent room gracefully', () => {
      expect(() => roomManager.removePlayerFromRoom('NONEXIST', 'player-1')).not.toThrow();
    });
  });

  describe('Room Count', () => {
    it('should return correct room count', () => {
      expect(roomManager.getRoomCount()).toBe(0);
      
      roomManager.createRoom('host-1', 4);
      expect(roomManager.getRoomCount()).toBe(1);
      
      roomManager.createRoom('host-2', 4);
      expect(roomManager.getRoomCount()).toBe(2);
    });
  });

  describe('Session Management', () => {
    it('should store session to player mapping', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      const room = roomManager.getRoom(roomId);
      expect(room!.sessions.get('session-1')).toBe('player-1');
    });

    it('should remove session when player is removed', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      
      roomManager.removePlayerFromRoom(roomId, 'player-1');
      
      const room = roomManager.getRoom(roomId);
      expect(room).toBeDefined();
      expect(room!.sessions.has('session-1')).toBe(false);
      expect(room!.sessions.has('session-2')).toBe(true);
    });
  });

  describe('Edge Cases - Requirements 3.2, 3.3, 8.4, 8.5', () => {
    describe('Room deletion when empty', () => {
      it('should mark room as empty when last player leaves', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        
        expect(roomManager.getRoom(roomId)).toBeDefined();
        
        roomManager.removePlayerFromRoom(roomId, 'player-1');
        
        const room = roomManager.getRoom(roomId);
        expect(room).toBeDefined();
        expect(room!.emptyAt).not.toBeNull();
        expect(room!.gameState.players).toHaveLength(0);
      });

      it('should mark room as empty when host is the only player and leaves', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
        
        expect(roomManager.getRoom(roomId)).toBeDefined();
        
        roomManager.removePlayerFromRoom(roomId, 'host-1');
        
        const room = roomManager.getRoom(roomId);
        expect(room).toBeDefined();
        expect(room!.emptyAt).not.toBeNull();
      });

      it('should mark room as empty when all players leave one by one', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        
        expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(3);
        
        roomManager.removePlayerFromRoom(roomId, 'player-1');
        expect(roomManager.getRoom(roomId)).toBeDefined();
        expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(2);
        expect(roomManager.getRoom(roomId)!.emptyAt).toBeNull();
        
        roomManager.removePlayerFromRoom(roomId, 'player-2');
        expect(roomManager.getRoom(roomId)).toBeDefined();
        expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(1);
        expect(roomManager.getRoom(roomId)!.emptyAt).toBeNull();
        
        roomManager.removePlayerFromRoom(roomId, 'player-3');
        const room = roomManager.getRoom(roomId);
        expect(room).toBeDefined();
        expect(room!.emptyAt).not.toBeNull();
        expect(room!.gameState.players).toHaveLength(0);
      });
    });

    describe('Host transfer when host leaves', () => {
      it('should transfer host to first remaining player when host leaves', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        
        const roomBefore = roomManager.getRoom(roomId)!;
        expect(roomBefore.hostId).toBe('host-1');
        expect(roomBefore.gameState.players[0].isHost).toBe(true);
        
        roomManager.removePlayerFromRoom(roomId, 'host-1');
        
        const roomAfter = roomManager.getRoom(roomId)!;
        expect(roomAfter.hostId).toBe('player-2');
        expect(roomAfter.gameState.hostId).toBe('player-2');
        expect(roomAfter.gameState.players[0].id).toBe('player-2');
        expect(roomAfter.gameState.players[0].isHost).toBe(true);
      });

      it('should transfer host correctly when host leaves with only one other player', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        
        roomManager.removePlayerFromRoom(roomId, 'host-1');
        
        const room = roomManager.getRoom(roomId)!;
        expect(room.hostId).toBe('player-2');
        expect(room.gameState.players).toHaveLength(1);
        expect(room.gameState.players[0].isHost).toBe(true);
      });

      it('should handle multiple host transfers in sequence', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        roomManager.addPlayerToRoom(roomId, 'player-4', 'Player 4', 'session-4');
        
        // First host leaves
        roomManager.removePlayerFromRoom(roomId, 'host-1');
        expect(roomManager.getRoom(roomId)!.hostId).toBe('player-2');
        
        // Second host leaves
        roomManager.removePlayerFromRoom(roomId, 'player-2');
        expect(roomManager.getRoom(roomId)!.hostId).toBe('player-3');
        
        // Third host leaves
        roomManager.removePlayerFromRoom(roomId, 'player-3');
        expect(roomManager.getRoom(roomId)!.hostId).toBe('player-4');
      });

      it('should not transfer host when non-host player leaves', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'host-1', 'Host', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        
        roomManager.removePlayerFromRoom(roomId, 'player-2');
        
        const room = roomManager.getRoom(roomId)!;
        expect(room.hostId).toBe('host-1');
        expect(room.gameState.players).toHaveLength(2);
      });
    });

    describe('Joining full room rejection', () => {
      it('should reject joining a room at maximum capacity', () => {
        const roomId = roomManager.createRoom('host-1', 3);
        roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        
        const result = roomManager.addPlayerToRoom(roomId, 'player-4', 'Player 4', 'session-4');
        
        expect(result).toBe(false);
        expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(3);
      });

      it('should reject joining when room has exactly maxPlayers', () => {
        const roomId = roomManager.createRoom('host-1', 2);
        roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        
        const result = roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        
        expect(result).toBe(false);
      });

      it('should allow joining when room is one below capacity', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        
        const result = roomManager.addPlayerToRoom(roomId, 'player-4', 'Player 4', 'session-4');
        
        expect(result).toBe(true);
        expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(4);
      });

      it('should reject multiple attempts to join full room', () => {
        const roomId = roomManager.createRoom('host-1', 2);
        roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        
        const result1 = roomManager.addPlayerToRoom(roomId, 'player-3', 'Player 3', 'session-3');
        const result2 = roomManager.addPlayerToRoom(roomId, 'player-4', 'Player 4', 'session-4');
        const result3 = roomManager.addPlayerToRoom(roomId, 'player-5', 'Player 5', 'session-5');
        
        expect(result1).toBe(false);
        expect(result2).toBe(false);
        expect(result3).toBe(false);
        expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(2);
      });
    });

    describe('Joining non-existent room', () => {
      it('should reject joining a room that does not exist', () => {
        const result = roomManager.addPlayerToRoom('FAKE123', 'player-1', 'Player 1', 'session-1');
        
        expect(result).toBe(false);
      });

      it('should reject joining a room that was deleted', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.deleteRoom(roomId);
        
        const result = roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        
        expect(result).toBe(false);
      });

      it('should reject joining with invalid room ID format', () => {
        const result1 = roomManager.addPlayerToRoom('', 'player-1', 'Player 1', 'session-1');
        const result2 = roomManager.addPlayerToRoom('ABC', 'player-1', 'Player 1', 'session-1');
        const result3 = roomManager.addPlayerToRoom('TOOLONG123', 'player-1', 'Player 1', 'session-1');
        
        expect(result1).toBe(false);
        expect(result2).toBe(false);
        expect(result3).toBe(false);
      });

      it('should reject joining a room that became empty and was marked for deletion', () => {
        const roomId = roomManager.createRoom('host-1', 4);
        roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
        
        // Room exists
        expect(roomManager.getRoom(roomId)).toBeDefined();
        
        // Last player leaves, room marked as empty
        roomManager.removePlayerFromRoom(roomId, 'player-1');
        const room = roomManager.getRoom(roomId);
        expect(room).toBeDefined();
        expect(room!.emptyAt).not.toBeNull();
        
        // Can still join the room before cleanup runs
        const result = roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
        
        expect(result).toBe(true);
        expect(roomManager.getRoom(roomId)!.emptyAt).toBeNull(); // No longer empty
      });
    });
  });

  describe('Room Cleanup and Lifecycle - Requirements 8.1, 8.2, 8.3', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delete empty rooms after 1 minute', () => {
      roomManager.startCleanupTask();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      // Room exists
      expect(roomManager.getRoom(roomId)).toBeDefined();
      
      // Player leaves, room becomes empty
      roomManager.removePlayerFromRoom(roomId, 'player-1');
      expect(roomManager.getRoom(roomId)).toBeDefined();
      expect(roomManager.getRoom(roomId)!.emptyAt).not.toBeNull();
      
      // Advance time by 30 seconds - room should still exist
      jest.advanceTimersByTime(30 * 1000);
      expect(roomManager.getRoom(roomId)).toBeDefined();
      
      // Advance time by another 35 seconds (total 65 seconds) - room should still exist
      jest.advanceTimersByTime(35 * 1000);
      expect(roomManager.getRoom(roomId)).toBeDefined();
      
      // Advance time to trigger cleanup (5 minutes from start)
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Room should be deleted now
      expect(roomManager.getRoom(roomId)).toBeUndefined();
    });

    it('should delete rooms inactive for 30 minutes', () => {
      roomManager.startCleanupTask();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      // Room exists
      expect(roomManager.getRoom(roomId)).toBeDefined();
      
      // Advance time by 29 minutes
      jest.advanceTimersByTime(29 * 60 * 1000);
      
      // Trigger cleanup check (5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Room should still exist (only 29 minutes inactive)
      expect(roomManager.getRoom(roomId)).toBeDefined();
      
      // Advance time by another 2 minutes (total 31 minutes inactive)
      jest.advanceTimersByTime(2 * 60 * 1000);
      
      // Trigger cleanup check
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Room should be deleted now
      expect(roomManager.getRoom(roomId)).toBeUndefined();
    });

    it('should run cleanup check every 5 minutes', () => {
      roomManager.startCleanupTask();
      
      const roomId1 = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId1, 'player-1', 'Player 1', 'session-1');
      roomManager.removePlayerFromRoom(roomId1, 'player-1');
      
      // First cleanup at 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);
      expect(roomManager.getRoom(roomId1)).toBeUndefined();
      
      // Create another room
      const roomId2 = roomManager.createRoom('host-2', 4);
      roomManager.addPlayerToRoom(roomId2, 'player-2', 'Player 2', 'session-2');
      roomManager.removePlayerFromRoom(roomId2, 'player-2');
      
      // Second cleanup at 10 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);
      expect(roomManager.getRoom(roomId2)).toBeUndefined();
    });

    it('should not delete rooms with active players', () => {
      roomManager.startCleanupTask();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      // Get the room and manually set lastActivity to 35 minutes ago
      const room = roomManager.getRoom(roomId)!;
      const oldDate = new Date(Date.now() - 35 * 60 * 1000);
      room.lastActivity = oldDate;
      
      // Trigger cleanup
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Room should be deleted because it's been inactive for 35 minutes
      expect(roomManager.getRoom(roomId)).toBeUndefined();
    });

    it('should reset emptyAt when player joins empty room', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      // Player leaves
      roomManager.removePlayerFromRoom(roomId, 'player-1');
      expect(roomManager.getRoom(roomId)!.emptyAt).not.toBeNull();
      
      // New player joins
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      expect(roomManager.getRoom(roomId)!.emptyAt).toBeNull();
    });

    it('should handle multiple rooms with different cleanup times', () => {
      roomManager.startCleanupTask();
      
      // Create room 1 and make it empty with emptyAt set to 2 minutes ago
      const roomId1 = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId1, 'player-1', 'Player 1', 'session-1');
      roomManager.removePlayerFromRoom(roomId1, 'player-1');
      const room1 = roomManager.getRoom(roomId1)!;
      room1.emptyAt = new Date(Date.now() - 2 * 60 * 1000);
      
      // Create room 2 and make it empty with emptyAt set to 2 minutes ago
      const roomId2 = roomManager.createRoom('host-2', 4);
      roomManager.addPlayerToRoom(roomId2, 'player-2', 'Player 2', 'session-2');
      roomManager.removePlayerFromRoom(roomId2, 'player-2');
      const room2 = roomManager.getRoom(roomId2)!;
      room2.emptyAt = new Date(Date.now() - 2 * 60 * 1000);
      
      // Trigger cleanup - both should be deleted
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      expect(roomManager.getRoom(roomId1)).toBeUndefined();
      expect(roomManager.getRoom(roomId2)).toBeUndefined();
    });

    it('should update lastActivity when player joins', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      const room = roomManager.getRoom(roomId)!;
      const initialActivity = room.lastActivity;
      
      // Advance time
      jest.advanceTimersByTime(1000);
      
      // Add player
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      const updatedRoom = roomManager.getRoom(roomId)!;
      expect(updatedRoom.lastActivity.getTime()).toBeGreaterThan(initialActivity.getTime());
    });

    it('should not delete inactive rooms if they have recent activity', () => {
      roomManager.startCleanupTask();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      // Advance 25 minutes
      jest.advanceTimersByTime(25 * 60 * 1000);
      
      // Update activity by adding another player
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      
      // Advance another 25 minutes (50 minutes total, but only 25 since last activity)
      jest.advanceTimersByTime(25 * 60 * 1000);
      
      // Trigger cleanup
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Room should still exist
      expect(roomManager.getRoom(roomId)).toBeDefined();
    });

    it('should stop cleanup task when stopCleanupTask is called', () => {
      roomManager.startCleanupTask();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      roomManager.removePlayerFromRoom(roomId, 'player-1');
      
      // Stop cleanup
      roomManager.stopCleanupTask();
      
      // Advance time past cleanup interval
      jest.advanceTimersByTime(10 * 60 * 1000);
      
      // Room should still exist because cleanup was stopped
      expect(roomManager.getRoom(roomId)).toBeDefined();
    });

    it('should not start multiple cleanup tasks', () => {
      roomManager.startCleanupTask();
      roomManager.startCleanupTask();
      roomManager.startCleanupTask();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      roomManager.removePlayerFromRoom(roomId, 'player-1');
      
      // Advance time
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Room should be deleted once
      expect(roomManager.getRoom(roomId)).toBeUndefined();
    });
  });

  describe('Disconnect Handling - Requirements 7.1, 7.2, 7.5, 7.6', () => {
    it('should mark player as disconnected', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      roomManager.markPlayerDisconnected(roomId, 'player-1');
      
      expect(roomManager.isPlayerDisconnected(roomId, 'player-1')).toBe(true);
    });

    it('should mark player as reconnected', () => {
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      roomManager.markPlayerDisconnected(roomId, 'player-1');
      expect(roomManager.isPlayerDisconnected(roomId, 'player-1')).toBe(true);
      
      roomManager.markPlayerReconnected(roomId, 'player-1');
      expect(roomManager.isPlayerDisconnected(roomId, 'player-1')).toBe(false);
    });

    it('should remove players disconnected for more than timeout', () => {
      jest.useFakeTimers();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      roomManager.addPlayerToRoom(roomId, 'player-2', 'Player 2', 'session-2');
      
      // Disconnect player 1
      roomManager.markPlayerDisconnected(roomId, 'player-1');
      
      // Advance time by 6 minutes
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      // Remove timed out players
      const removed = roomManager.removeTimedOutPlayers(roomId);
      
      expect(removed).toContain('player-1');
      expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(1);
      expect(roomManager.getRoom(roomId)!.gameState.players[0].id).toBe('player-2');
      
      jest.useRealTimers();
    });

    it('should not remove players disconnected for less than timeout', () => {
      jest.useFakeTimers();
      
      const roomId = roomManager.createRoom('host-1', 4);
      roomManager.addPlayerToRoom(roomId, 'player-1', 'Player 1', 'session-1');
      
      roomManager.markPlayerDisconnected(roomId, 'player-1');
      
      // Advance time by 4 minutes (less than 5 minute timeout)
      jest.advanceTimersByTime(4 * 60 * 1000);
      
      const removed = roomManager.removeTimedOutPlayers(roomId);
      
      expect(removed).toHaveLength(0);
      expect(roomManager.getRoom(roomId)!.gameState.players).toHaveLength(1);
      
      jest.useRealTimers();
    });

    it('should handle disconnect on non-existent room gracefully', () => {
      expect(() => roomManager.markPlayerDisconnected('FAKE123', 'player-1')).not.toThrow();
      expect(() => roomManager.markPlayerReconnected('FAKE123', 'player-1')).not.toThrow();
      expect(roomManager.isPlayerDisconnected('FAKE123', 'player-1')).toBe(false);
    });
  });
});
