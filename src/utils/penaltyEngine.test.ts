import { Card } from '../types';
import {
  getCardValue,
  hasDuplicateRank,
  findSubsetSum,
  getLongestCombination,
  checkPenalty
} from './penaltyEngine';

describe('PenaltyEngine', () => {
  // Helper function to create cards
  const createCard = (rank: Card['rank'], suit: Card['suit'] = 'hearts'): Card => ({
    rank,
    suit,
    id: `${suit}-${rank}`
  });

  describe('getCardValue', () => {
    it('should return 1 for Ace', () => {
      expect(getCardValue(createCard('A'))).toBe(1);
    });

    it('should return face value for number cards', () => {
      expect(getCardValue(createCard('2'))).toBe(2);
      expect(getCardValue(createCard('5'))).toBe(5);
      expect(getCardValue(createCard('10'))).toBe(10);
    });

    it('should return null for face cards', () => {
      expect(getCardValue(createCard('J'))).toBe(null);
      expect(getCardValue(createCard('Q'))).toBe(null);
      expect(getCardValue(createCard('K'))).toBe(null);
    });
  });

  describe('hasDuplicateRank', () => {
    it('should return true when rank exists on table', () => {
      const playedCard = createCard('5');
      const tableCards = [createCard('3'), createCard('5', 'diamonds'), createCard('7')];
      expect(hasDuplicateRank(playedCard, tableCards)).toBe(true);
    });

    it('should return false when rank does not exist on table', () => {
      const playedCard = createCard('5');
      const tableCards = [createCard('3'), createCard('7'), createCard('9')];
      expect(hasDuplicateRank(playedCard, tableCards)).toBe(false);
    });

    it('should return false for empty table', () => {
      const playedCard = createCard('5');
      expect(hasDuplicateRank(playedCard, [])).toBe(false);
    });
  });

  describe('findSubsetSum', () => {
    it('should find single card matching target', () => {
      const cards = [createCard('3'), createCard('5'), createCard('7')];
      const result = findSubsetSum(cards, 5);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContainEqual(createCard('5'));
    });

    it('should find multiple cards summing to target', () => {
      const cards = [createCard('2'), createCard('3'), createCard('5')];
      const result = findSubsetSum(cards, 5);
      expect(result.length).toBeGreaterThan(0);
      // Should find both [5] and [2, 3]
      const hasSingleCard = result.some(combo => combo.length === 1);
      const hasTwoCards = result.some(combo => combo.length === 2);
      expect(hasSingleCard || hasTwoCards).toBe(true);
    });

    it('should return empty array when no combination matches', () => {
      const cards = [createCard('2'), createCard('3')];
      const result = findSubsetSum(cards, 10);
      expect(result).toEqual([]);
    });

    it('should ignore face cards', () => {
      const cards = [createCard('J'), createCard('Q'), createCard('5')];
      const result = findSubsetSum(cards, 5);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContainEqual(createCard('5'));
    });
  });

  describe('getLongestCombination', () => {
    it('should return the longest combination', () => {
      const combo1 = [createCard('2')];
      const combo2 = [createCard('2'), createCard('3')];
      const combo3 = [createCard('A'), createCard('2'), createCard('3')];
      const result = getLongestCombination([combo1, combo2, combo3]);
      expect(result).toEqual(combo3);
    });

    it('should return empty array for empty input', () => {
      expect(getLongestCombination([])).toEqual([]);
    });
  });

  describe('checkPenalty', () => {
    it('should detect duplicate rank penalty', () => {
      const playedCard = createCard('5');
      const tableCards = [createCard('3'), createCard('5', 'diamonds'), createCard('7')];
      const result = checkPenalty(playedCard, tableCards);
      expect(result).not.toBe(null);
      expect(result?.length).toBe(2); // Played card + matching card
    });

    it('should detect subset sum penalty', () => {
      const playedCard = createCard('5');
      const tableCards = [createCard('2'), createCard('3')];
      const result = checkPenalty(playedCard, tableCards);
      expect(result).not.toBe(null);
      expect(result?.length).toBe(3); // Played card + 2 + 3
    });

    it('should return null when no penalty', () => {
      const playedCard = createCard('5');
      const tableCards = [createCard('2'), createCard('7')];
      const result = checkPenalty(playedCard, tableCards);
      expect(result).toBe(null);
    });

    it('should not apply sum penalty to face cards', () => {
      const playedCard = createCard('K');
      const tableCards = [createCard('5'), createCard('8')]; // 5 + 8 = 13, but K has no value
      const result = checkPenalty(playedCard, tableCards);
      expect(result).toBe(null);
    });

    it('should apply rank penalty to face cards', () => {
      const playedCard = createCard('K');
      const tableCards = [createCard('K', 'diamonds'), createCard('5')];
      const result = checkPenalty(playedCard, tableCards);
      expect(result).not.toBe(null);
      expect(result?.length).toBe(2); // Played card + matching K
    });

    it('should collect all cards when both penalties apply', () => {
      const playedCard = createCard('6');
      const tableCards = [createCard('A'), createCard('2'), createCard('3'), createCard('6', 'diamonds')];
      // Duplicate rank: 6 (on table)
      // Sum match: A+2+3 = 6
      // Should collect ALL: played 6 + duplicate 6 + A + 2 + 3 = 5 cards total
      const result = checkPenalty(playedCard, tableCards);
      expect(result).not.toBe(null);
      expect(result?.length).toBe(5); // Played card + duplicate 6 + A + 2 + 3
      // Verify it contains all cards
      const ranks = result?.map(c => c.rank).sort();
      expect(ranks).toEqual(['2', '3', '6', '6', 'A']);
    });

    it('should collect both duplicate and sum cards when both apply', () => {
      const playedCard = createCard('3');
      const tableCards = [createCard('3', 'diamonds'), createCard('A'), createCard('2')];
      // Duplicate rank: 3 (on table)
      // Sum match: A+2 = 3
      // Should collect ALL: played 3 + duplicate 3 + A + 2 = 4 cards total
      const result = checkPenalty(playedCard, tableCards);
      expect(result).not.toBe(null);
      expect(result?.length).toBe(4); // Played card + duplicate 3 + A + 2
      const ranks = result?.map(c => c.rank).sort();
      expect(ranks).toEqual(['2', '3', '3', 'A']);
    });

    it('should collect all duplicates and sum cards', () => {
      const playedCard = createCard('5');
      const tableCards = [createCard('5', 'diamonds'), createCard('5', 'hearts'), createCard('2'), createCard('3')];
      // Duplicate rank: 5 + 5 (on table)
      // Sum match: 2+3 = 5
      // Should collect ALL: played 5 + two 5s + 2 + 3 = 5 cards total
      const result = checkPenalty(playedCard, tableCards);
      expect(result).not.toBe(null);
      expect(result?.length).toBe(5);
      const ranks = result?.map(c => c.rank).sort();
      expect(ranks).toEqual(['2', '3', '5', '5', '5']);
    });

    it('should not penalize J when no J on table and no sum match', () => {
      const playedCard = createCard('J');
      const tableCards = [createCard('2'), createCard('5'), createCard('7')];
      const result = checkPenalty(playedCard, tableCards);
      expect(result).toBe(null);
    });

    it('should not penalize Q when no Q on table', () => {
      const playedCard = createCard('Q');
      const tableCards = [createCard('A'), createCard('K'), createCard('10')];
      const result = checkPenalty(playedCard, tableCards);
      expect(result).toBe(null);
    });

    it('should not penalize K when no K on table', () => {
      const playedCard = createCard('K');
      const tableCards = [createCard('3'), createCard('4'), createCard('5')];
      const result = checkPenalty(playedCard, tableCards);
      expect(result).toBe(null);
    });
  });
});
