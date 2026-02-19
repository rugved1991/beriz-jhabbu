/**
 * Unit tests for card position utilities
 */

import { generateCardPosition } from './cardPositionUtils';
import { CardPosition } from '../types';

describe('cardPositionUtils', () => {
  describe('generateCardPosition', () => {
    it('should generate position in one of 13 fixed slots', () => {
      const centerX = 0;
      const centerY = 0;
      const existingPositions: CardPosition[] = [];
      
      const position = generateCardPosition(existingPositions, centerX, centerY);
      
      // Should be in one of the 13 slots
      // With 75px spacing and 13 slots: total width = 12 * 75 = 900px
      // Slots range from -450 to +450
      expect(position.x).toBeGreaterThanOrEqual(-450);
      expect(position.x).toBeLessThanOrEqual(450);
      expect(position.y).toBe(0);
    });

    it('should have zero rotation to prevent overlap', () => {
      const existingPositions: CardPosition[] = [];
      
      const position = generateCardPosition(existingPositions);
      
      // No rotation to ensure cards don't overlap
      expect(position.rotation).toBe(0);
    });

    it('should set z-index to 1 for first card', () => {
      const existingPositions: CardPosition[] = [];
      
      const position = generateCardPosition(existingPositions);
      
      expect(position.zIndex).toBe(1);
    });

    it('should increment z-index for each new card', () => {
      const existingPositions: CardPosition[] = [
        { x: -600, y: 0, rotation: 0, zIndex: 1 },
        { x: -500, y: 0, rotation: 0, zIndex: 2 },
        { x: -400, y: 0, rotation: 0, zIndex: 3 }
      ];
      
      const position = generateCardPosition(existingPositions);
      
      expect(position.zIndex).toBe(4);
    });

    it('should use default center coordinates when not provided', () => {
      const existingPositions: CardPosition[] = [];
      
      const position = generateCardPosition(existingPositions);
      
      // Should be within the 13 slots range (-450 to +450)
      expect(position.x).toBeGreaterThanOrEqual(-450);
      expect(position.x).toBeLessThanOrEqual(450);
      expect(position.y).toBe(0);
    });

    it('should place cards in random available slots', () => {
      const positions: CardPosition[] = [];
      const xPositions = new Set<number>();
      
      // Generate 5 cards
      for (let i = 0; i < 5; i++) {
        const newPosition = generateCardPosition(positions);
        positions.push(newPosition);
        xPositions.add(newPosition.x);
      }
      
      // All cards should have unique x positions (different slots)
      expect(xPositions.size).toBe(5);
      
      // All cards should be at same vertical level
      positions.forEach(p => expect(p.y).toBe(0));
      
      // All positions should be valid slot positions (multiples of 75 from center)
      // With 75px spacing: slots are at -450, -375, -300, -225, -150, -75, 0, 75, 150, 225, 300, 375, 450
      positions.forEach(p => {
        const offsetFromCenter = Math.abs(p.x);
        expect(offsetFromCenter % 75).toBe(0);
      });
    });

    it('should handle custom center coordinates', () => {
      const centerX = 500;
      const centerY = 400;
      const existingPositions: CardPosition[] = [];
      
      const position = generateCardPosition(existingPositions, centerX, centerY);
      
      // Should be offset from custom center (within -450 to +450 range)
      expect(position.x).toBeGreaterThanOrEqual(centerX - 450);
      expect(position.x).toBeLessThanOrEqual(centerX + 450);
      expect(position.y).toBe(centerY);
    });

    it('should maintain z-index monotonicity with multiple cards', () => {
      const positions: CardPosition[] = [];
      
      for (let i = 0; i < 10; i++) {
        const newPosition = generateCardPosition(positions);
        expect(newPosition.zIndex).toBe(i + 1);
        positions.push(newPosition);
      }
      
      // Verify all z-indices are unique and increasing
      for (let i = 0; i < positions.length; i++) {
        expect(positions[i].zIndex).toBe(i + 1);
      }
    });

    it('should generate valid CardPosition object structure', () => {
      const existingPositions: CardPosition[] = [];
      
      const position = generateCardPosition(existingPositions);
      
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('rotation');
      expect(position).toHaveProperty('zIndex');
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
      expect(typeof position.rotation).toBe('number');
      expect(typeof position.zIndex).toBe('number');
    });

    it('should not place two cards in the same slot', () => {
      const positions: CardPosition[] = [];
      
      // Generate 13 cards (all slots)
      for (let i = 0; i < 13; i++) {
        const newPosition = generateCardPosition(positions);
        positions.push(newPosition);
      }
      
      // All x positions should be unique
      const xPositions = positions.map(p => p.x);
      const uniqueXPositions = new Set(xPositions);
      expect(uniqueXPositions.size).toBe(13);
    });

    it('should handle all 13 slots being filled', () => {
      const positions: CardPosition[] = [];
      
      // Fill all 13 slots
      for (let i = 0; i < 13; i++) {
        const newPosition = generateCardPosition(positions);
        positions.push(newPosition);
      }
      
      // Try to add a 14th card (should fall back to sequential placement)
      const extraPosition = generateCardPosition(positions);
      
      // Should still generate a valid position
      expect(extraPosition).toHaveProperty('x');
      expect(extraPosition).toHaveProperty('y');
      expect(extraPosition.zIndex).toBe(14);
    });
  });
});
