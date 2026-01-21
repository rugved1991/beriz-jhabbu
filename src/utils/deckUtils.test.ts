/**
 * Unit tests for deck management utilities
 */

import { calculateDeckCount, isValidPlayerCount, generateDecks, dealCards } from './deckUtils';

describe('deckUtils', () => {
  describe('calculateDeckCount', () => {
    it('should calculate correct deck count for 2 players', () => {
      expect(calculateDeckCount(2)).toBe(1);
    });

    it('should calculate correct deck count for 4 players', () => {
      expect(calculateDeckCount(4)).toBe(1);
    });

    it('should calculate correct deck count for 5 players', () => {
      expect(calculateDeckCount(5)).toBe(2);
    });

    it('should calculate correct deck count for 8 players', () => {
      expect(calculateDeckCount(8)).toBe(2);
    });

    it('should calculate correct deck count for 9 players', () => {
      expect(calculateDeckCount(9)).toBe(3);
    });

    it('should calculate correct deck count for 16 players', () => {
      expect(calculateDeckCount(16)).toBe(4);
    });
  });

  describe('isValidPlayerCount', () => {
    it('should accept 2 players', () => {
      expect(isValidPlayerCount(2)).toBe(true);
    });

    it('should accept 16 players', () => {
      expect(isValidPlayerCount(16)).toBe(true);
    });

    it('should accept 8 players', () => {
      expect(isValidPlayerCount(8)).toBe(true);
    });

    it('should reject 1 player', () => {
      expect(isValidPlayerCount(1)).toBe(false);
    });

    it('should reject 17 players', () => {
      expect(isValidPlayerCount(17)).toBe(false);
    });

    it('should reject 0 players', () => {
      expect(isValidPlayerCount(0)).toBe(false);
    });

    it('should reject negative numbers', () => {
      expect(isValidPlayerCount(-5)).toBe(false);
    });

    it('should reject non-integer values', () => {
      expect(isValidPlayerCount(3.5)).toBe(false);
    });
  });

  describe('generateDecks', () => {
    it('should generate 52 cards for 1 deck', () => {
      const cards = generateDecks(1);
      expect(cards).toHaveLength(52);
    });

    it('should generate 104 cards for 2 decks', () => {
      const cards = generateDecks(2);
      expect(cards).toHaveLength(104);
    });

    it('should generate 156 cards for 3 decks', () => {
      const cards = generateDecks(3);
      expect(cards).toHaveLength(156);
    });

    it('should generate cards with all suits', () => {
      const cards = generateDecks(1);
      const suits = new Set(cards.map(c => c.suit));
      expect(suits.size).toBe(4);
      expect(suits.has('hearts')).toBe(true);
      expect(suits.has('diamonds')).toBe(true);
      expect(suits.has('clubs')).toBe(true);
      expect(suits.has('spades')).toBe(true);
    });

    it('should generate cards with all ranks', () => {
      const cards = generateDecks(1);
      const ranks = new Set(cards.map(c => c.rank));
      expect(ranks.size).toBe(13);
    });

    it('should generate unique card IDs', () => {
      const cards = generateDecks(2);
      const ids = new Set(cards.map(c => c.id));
      expect(ids.size).toBe(cards.length);
    });

    it('should shuffle cards (not in predictable order)', () => {
      const cards1 = generateDecks(1);
      const cards2 = generateDecks(1);
      
      // Check that at least some cards are in different positions
      let differences = 0;
      for (let i = 0; i < Math.min(10, cards1.length); i++) {
        if (cards1[i].id !== cards2[i].id) {
          differences++;
        }
      }
      
      // With proper shuffling, we expect at least some differences
      expect(differences).toBeGreaterThan(0);
    });
  });

  describe('dealCards', () => {
    it('should distribute all cards to players', () => {
      const deck = generateDecks(1);
      const deckSize = deck.length;
      const hands = dealCards(deck, 4);
      
      // Check that deck is empty
      expect(deck).toHaveLength(0);
      
      // Check that all cards were distributed
      const totalCards = hands.reduce((sum, hand) => sum + hand.length, 0);
      expect(totalCards).toBe(deckSize);
    });

    it('should deal cards in round-robin order', () => {
      const deck = generateDecks(1);
      const originalOrder = [...deck];
      const hands = dealCards(deck, 3);
      
      // First 3 cards should go to players 0, 1, 2
      expect(hands[0][0]).toEqual(originalOrder[0]);
      expect(hands[1][0]).toEqual(originalOrder[1]);
      expect(hands[2][0]).toEqual(originalOrder[2]);
      
      // Next 3 cards should go to players 0, 1, 2 again
      expect(hands[0][1]).toEqual(originalOrder[3]);
      expect(hands[1][1]).toEqual(originalOrder[4]);
      expect(hands[2][1]).toEqual(originalOrder[5]);
    });

    it('should handle uneven distribution', () => {
      const deck = generateDecks(1); // 52 cards
      const hands = dealCards(deck, 5); // 52 / 5 = 10 remainder 2
      
      // First 2 players should get 11 cards, rest get 10
      expect(hands[0]).toHaveLength(11);
      expect(hands[1]).toHaveLength(11);
      expect(hands[2]).toHaveLength(10);
      expect(hands[3]).toHaveLength(10);
      expect(hands[4]).toHaveLength(10);
    });

    it('should empty the deck after dealing', () => {
      const deck = generateDecks(2);
      dealCards(deck, 8);
      
      expect(deck).toHaveLength(0);
    });

    it('should create correct number of hands', () => {
      const deck = generateDecks(1);
      const hands = dealCards(deck, 6);
      
      expect(hands).toHaveLength(6);
    });

    it('should deal to 2 players', () => {
      const deck = generateDecks(1); // 52 cards
      const hands = dealCards(deck, 2);
      
      expect(hands).toHaveLength(2);
      expect(hands[0]).toHaveLength(26);
      expect(hands[1]).toHaveLength(26);
      expect(deck).toHaveLength(0);
    });

    it('should deal to 16 players', () => {
      const deckCount = calculateDeckCount(16);
      const deck = generateDecks(deckCount); // 4 decks = 208 cards
      const totalCards = deck.length;
      const hands = dealCards(deck, 16);
      
      expect(hands).toHaveLength(16);
      
      // Verify all cards distributed
      const distributedCards = hands.reduce((sum, hand) => sum + hand.length, 0);
      expect(distributedCards).toBe(totalCards);
      expect(deck).toHaveLength(0);
    });

    it('should not duplicate or lose cards', () => {
      const deck = generateDecks(1);
      const originalIds = new Set(deck.map(c => c.id));
      const hands = dealCards(deck, 4);
      
      // Collect all card IDs from hands
      const dealtIds = new Set<string>();
      hands.forEach(hand => {
        hand.forEach(card => {
          dealtIds.add(card.id);
        });
      });
      
      // Should have same IDs
      expect(dealtIds.size).toBe(originalIds.size);
      originalIds.forEach(id => {
        expect(dealtIds.has(id)).toBe(true);
      });
    });
  });
});
