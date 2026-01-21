/**
 * Tests for Phase 1 (Beriz) game logic
 */

import { handlePhase1CardPlay, checkPhase1Completion, handlePhase1Completion } from './phase1Logic';
import { Card, Player } from '../types';

describe('Phase 1 Logic', () => {
  // Helper function to create a test card
  const createCard = (suit: 'hearts' | 'diamonds' | 'clubs' | 'spades', rank: string, id?: string): Card => ({
    suit,
    rank: rank as any,
    id: id || `${suit}-${rank}-test`
  });

  // Helper function to create a test player
  const createPlayer = (id: string, hand: Card[], sideDeck: Card[] = []): Player => ({
    id,
    name: `Player ${id}`,
    hand,
    sideDeck,
    isActive: true,
    isHost: id === '1',
    position: parseInt(id) - 1
  });

  describe('handlePhase1CardPlay', () => {
    it('should successfully play a card with no penalty', () => {
      const card = createCard('hearts', '5');
      const players = [createPlayer('1', [card])];
      const table: Card[] = [];

      const result = handlePhase1CardPlay('1', card, players, table);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.penaltyCards).toBeUndefined();
      expect(result.updatedPlayers[0].hand).toHaveLength(0);
      expect(result.updatedPlayers[0].sideDeck).toHaveLength(0);
      expect(result.updatedTable).toHaveLength(1);
      expect(result.updatedTable[0]).toEqual(card);
    });

    it('should detect duplicate rank penalty', () => {
      const card = createCard('hearts', '5', 'hearts-5-1');
      const tableCard = createCard('diamonds', '5', 'diamonds-5-1');
      const players = [createPlayer('1', [card])];
      const table = [tableCard];

      const result = handlePhase1CardPlay('1', card, players, table);

      expect(result.success).toBe(true);
      expect(result.penaltyCards).toHaveLength(2);
      expect(result.updatedPlayers[0].hand).toHaveLength(0);
      expect(result.updatedPlayers[0].sideDeck).toHaveLength(2);
      expect(result.updatedTable).toHaveLength(0);
    });

    it('should detect subset sum penalty', () => {
      const card = createCard('hearts', '5', 'hearts-5-1');
      const tableCard1 = createCard('diamonds', '2', 'diamonds-2-1');
      const tableCard2 = createCard('clubs', '3', 'clubs-3-1');
      const players = [createPlayer('1', [card])];
      const table = [tableCard1, tableCard2];

      const result = handlePhase1CardPlay('1', card, players, table);

      expect(result.success).toBe(true);
      expect(result.penaltyCards).toBeDefined();
      expect(result.penaltyCards!.length).toBeGreaterThan(0);
      expect(result.updatedPlayers[0].sideDeck.length).toBeGreaterThan(0);
      expect(result.updatedTable.length).toBeLessThan(table.length);
    });

    it('should return error if player not found', () => {
      const card = createCard('hearts', '5');
      const players = [createPlayer('1', [card])];
      const table: Card[] = [];

      const result = handlePhase1CardPlay('999', card, players, table);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should return error if card not in hand', () => {
      const card = createCard('hearts', '5');
      const otherCard = createCard('diamonds', '3');
      const players = [createPlayer('1', [otherCard])];
      const table: Card[] = [];

      const result = handlePhase1CardPlay('1', card, players, table);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card not in player hand');
    });

    it('should maintain hand and side deck separation', () => {
      const card = createCard('hearts', '5', 'hearts-5-1');
      const tableCard = createCard('diamonds', '5', 'diamonds-5-1');
      const handCard = createCard('clubs', '7', 'clubs-7-1');
      const sideDeckCard = createCard('spades', '2', 'spades-2-1');
      
      const players = [createPlayer('1', [card, handCard], [sideDeckCard])];
      const table = [tableCard];

      const result = handlePhase1CardPlay('1', card, players, table);

      expect(result.success).toBe(true);
      // Hand should have one card (the other card not played)
      expect(result.updatedPlayers[0].hand).toHaveLength(1);
      expect(result.updatedPlayers[0].hand[0].id).toBe('clubs-7-1');
      // Side deck should have original card plus penalty cards
      expect(result.updatedPlayers[0].sideDeck).toHaveLength(3);
      expect(result.updatedPlayers[0].sideDeck[0].id).toBe('spades-2-1');
    });
  });

  describe('checkPhase1Completion', () => {
    it('should return true when all players have empty hands', () => {
      const players = [
        createPlayer('1', []),
        createPlayer('2', []),
        createPlayer('3', [])
      ];

      expect(checkPhase1Completion(players)).toBe(true);
    });

    it('should return false when any player has cards in hand', () => {
      const card = createCard('hearts', '5');
      const players = [
        createPlayer('1', []),
        createPlayer('2', [card]),
        createPlayer('3', [])
      ];

      expect(checkPhase1Completion(players)).toBe(false);
    });

    it('should return true for single player with empty hand', () => {
      const players = [createPlayer('1', [])];

      expect(checkPhase1Completion(players)).toBe(true);
    });
  });

  describe('handlePhase1Completion', () => {
    it('should move all table cards to last player side deck', () => {
      const tableCard1 = createCard('hearts', '5');
      const tableCard2 = createCard('diamonds', '3');
      const tableCard3 = createCard('clubs', '7');
      const table = [tableCard1, tableCard2, tableCard3];

      const players = [
        createPlayer('1', []),
        createPlayer('2', []),
        createPlayer('3', [])
      ];

      const result = handlePhase1Completion('2', players, table);

      expect(result[0].sideDeck).toHaveLength(0);
      expect(result[1].sideDeck).toHaveLength(3);
      expect(result[2].sideDeck).toHaveLength(0);
      expect(result[1].sideDeck).toEqual(table);
    });

    it('should preserve existing side deck cards', () => {
      const existingCard = createCard('spades', '2');
      const tableCard = createCard('hearts', '5');
      const table = [tableCard];

      const players = [
        createPlayer('1', [], [existingCard]),
        createPlayer('2', [])
      ];

      const result = handlePhase1Completion('1', players, table);

      expect(result[0].sideDeck).toHaveLength(2);
      expect(result[0].sideDeck[0]).toEqual(existingCard);
      expect(result[0].sideDeck[1]).toEqual(tableCard);
    });

    it('should return unchanged players if table is empty', () => {
      const players = [
        createPlayer('1', []),
        createPlayer('2', [])
      ];

      const result = handlePhase1Completion('1', players, []);

      expect(result).toEqual(players);
    });

    it('should return unchanged players if player not found', () => {
      const table = [createCard('hearts', '5')];
      const players = [createPlayer('1', [])];

      const result = handlePhase1Completion('999', players, table);

      expect(result).toEqual(players);
    });
  });
});
