import { generateRoomId, isValidRoomId } from './roomUtils';

describe('roomUtils', () => {
  describe('generateRoomId', () => {
    it('should generate a 6-character room ID', () => {
      const roomId = generateRoomId();
      expect(roomId).toHaveLength(6);
    });

    it('should generate alphanumeric characters only', () => {
      const roomId = generateRoomId();
      expect(roomId).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate different IDs on subsequent calls', () => {
      const id1 = generateRoomId();
      const id2 = generateRoomId();
      const id3 = generateRoomId();
      
      // While theoretically possible to get duplicates, it's extremely unlikely
      const uniqueIds = new Set([id1, id2, id3]);
      expect(uniqueIds.size).toBeGreaterThan(1);
    });
  });

  describe('isValidRoomId', () => {
    it('should return true for valid 6-character alphanumeric IDs', () => {
      expect(isValidRoomId('ABC123')).toBe(true);
      expect(isValidRoomId('XYZ789')).toBe(true);
      expect(isValidRoomId('000000')).toBe(true);
      expect(isValidRoomId('AAAAAA')).toBe(true);
    });

    it('should return false for invalid IDs', () => {
      expect(isValidRoomId('abc123')).toBe(false); // lowercase
      expect(isValidRoomId('ABC12')).toBe(false); // too short
      expect(isValidRoomId('ABC1234')).toBe(false); // too long
      expect(isValidRoomId('ABC-12')).toBe(false); // special character
      expect(isValidRoomId('')).toBe(false); // empty
      expect(isValidRoomId('ABC 12')).toBe(false); // space
    });
  });
});
