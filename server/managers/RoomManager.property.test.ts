/**
 * Property-based tests for RoomManager (task 2.2)
 *
 * Each property must hold for all valid inputs, not just specific examples.
 * Tests use fast-check to generate arbitrary inputs and verify invariants.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 3.1, 3.6
 */

import fc from 'fast-check';
import { RoomManager } from './RoomManager';

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

/** Non-empty string to use as a player/host ID */
const idArb = fc.string({ minLength: 1, maxLength: 30 });

/** Valid maxPlayers value per game rules (2–16) */
const maxPlayersArb = fc.integer({ min: 2, max: 16 });

// ---------------------------------------------------------------------------
// Property 2: Room ID Uniqueness (REQ-2.1, REQ-2.2)
// Every createRoom call must return an ID not seen before on the same manager.
// ---------------------------------------------------------------------------

describe('Property 2: Room ID Uniqueness', () => {
  it('should produce unique room IDs across multiple createRoom calls', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (roomCount) => {
          const manager = new RoomManager();
          const ids = new Set<string>();

          for (let i = 0; i < roomCount; i++) {
            const roomId = manager.createRoom(`host-${i}`, 4);
            ids.add(roomId);
          }

          manager.stopCleanupTask();
          expect(ids.size).toBe(roomCount);
        }
      )
    );
  });

  it('should produce room IDs matching the 6-character alphanumeric format', () => {
    fc.assert(
      fc.property(idArb, maxPlayersArb, (hostId, maxPlayers) => {
        const manager = new RoomManager();
        const roomId = manager.createRoom(hostId, maxPlayers);

        manager.stopCleanupTask();
        expect(roomId).toHaveLength(6);
        expect(roomId).toMatch(/^[A-Z0-9]{6}$/);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Room Creator is Host (REQ-2.3)
// The hostId recorded on the room must always equal the ID passed to createRoom.
// ---------------------------------------------------------------------------

describe('Property 3: Room Creator is Host', () => {
  it('should always designate the creator as host', () => {
    fc.assert(
      fc.property(idArb, maxPlayersArb, (hostId, maxPlayers) => {
        const manager = new RoomManager();
        const roomId = manager.createRoom(hostId, maxPlayers);
        const room = manager.getRoom(roomId)!;

        manager.stopCleanupTask();
        expect(room.hostId).toBe(hostId);
        expect(room.gameState.hostId).toBe(hostId);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Room Configuration Persistence (REQ-2.4)
// The maxPlayers value supplied at creation must be stored unchanged.
// ---------------------------------------------------------------------------

describe('Property 4: Room Configuration Persistence', () => {
  it('should preserve the max player count exactly as provided', () => {
    fc.assert(
      fc.property(idArb, maxPlayersArb, (hostId, maxPlayers) => {
        const manager = new RoomManager();
        const roomId = manager.createRoom(hostId, maxPlayers);
        const room = manager.getRoom(roomId)!;

        manager.stopCleanupTask();
        expect(room.maxPlayers).toBe(maxPlayers);
        expect(room.gameState.maxPlayers).toBe(maxPlayers);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Initial Room Phase (REQ-2.6)
// Every new room must start in the LOBBY phase — never any other phase.
// ---------------------------------------------------------------------------

describe('Property 6: Initial Room Phase', () => {
  it('should always initialise new rooms in the LOBBY phase', () => {
    fc.assert(
      fc.property(idArb, maxPlayersArb, (hostId, maxPlayers) => {
        const manager = new RoomManager();
        const roomId = manager.createRoom(hostId, maxPlayers);
        const room = manager.getRoom(roomId)!;

        manager.stopCleanupTask();
        expect(room.gameState.phase).toBe('LOBBY');
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Successful Join Increases Player Count (REQ-3.1)
// Adding a player to a room that has capacity must increase the count by 1.
// maxPlayers >= 2 guarantees at least one free slot when the room is fresh.
// ---------------------------------------------------------------------------

describe('Property 7: Successful Join Increases Player Count', () => {
  it('should increase player count by exactly one on a valid join', () => {
    fc.assert(
      fc.property(
        idArb,
        maxPlayersArb,
        idArb,
        (hostId, maxPlayers, joinerName) => {
          const manager = new RoomManager();
          const roomId = manager.createRoom(hostId, maxPlayers);
          const before = manager.getRoom(roomId)!.gameState.players.length;

          // Fresh room has 0 players; maxPlayers >= 2 ensures room for at least 1 join
          const result = manager.addPlayerToRoom(roomId, 'joiner-1', joinerName, 'session-1');

          manager.stopCleanupTask();
          expect(result).toBe(true);
          const after = manager.getRoom(roomId)!.gameState.players.length;
          expect(after).toBe(before + 1);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Player ID Uniqueness Within Room (REQ-3.6)
// All players inside a room must have distinct IDs at any point in time.
// IDs are caller-supplied; we generate unique ones to reflect the expected
// usage from a socket handler.
// ---------------------------------------------------------------------------

describe('Property 9: Player ID Uniqueness Within Room', () => {
  it('should maintain unique player IDs for all players in a room', () => {
    fc.assert(
      fc.property(
        idArb,
        maxPlayersArb,
        fc.integer({ min: 1, max: 15 }),
        (hostId, maxPlayers, extraCount) => {
          const manager = new RoomManager();
          const roomId = manager.createRoom(hostId, maxPlayers);

          // Add as many players as the room allows (up to extraCount)
          const playersToAdd = Math.min(extraCount, maxPlayers);
          for (let i = 0; i < playersToAdd; i++) {
            manager.addPlayerToRoom(roomId, `player-${i}`, `Player ${i}`, `session-${i}`);
          }

          const room = manager.getRoom(roomId)!;
          const ids = room.gameState.players.map(p => p.id);
          const uniqueIds = new Set(ids);

          manager.stopCleanupTask();
          expect(uniqueIds.size).toBe(ids.length);
        }
      )
    );
  });
});
