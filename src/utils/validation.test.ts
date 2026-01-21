/**
 * Tests for validation utilities
 */

import {
  validatePlayerCount,
  validateRoomId,
  validatePlayerName,
  formatCardPlayError
} from './validation';

describe('validatePlayerCount', () => {
  it('should accept valid player counts', () => {
    expect(validatePlayerCount(2).valid).toBe(true);
    expect(validatePlayerCount(8).valid).toBe(true);
    expect(validatePlayerCount(16).valid).toBe(true);
  });

  it('should reject player count below 2', () => {
    const result = validatePlayerCount(1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Player count must be at least 2');
  });

  it('should reject player count above 16', () => {
    const result = validatePlayerCount(17);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Player count cannot exceed 16');
  });

  it('should reject NaN', () => {
    const result = validatePlayerCount(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Player count must be a number');
  });
});

describe('validateRoomId', () => {
  it('should accept valid room IDs', () => {
    expect(validateRoomId('ABC123').valid).toBe(true);
    expect(validateRoomId('XYZ789').valid).toBe(true);
    expect(validateRoomId('000000').valid).toBe(true);
  });

  it('should reject empty room ID', () => {
    const result = validateRoomId('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Room ID is required');
  });

  it('should reject room ID with wrong length', () => {
    const result = validateRoomId('ABC12');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Room ID must be 6 characters');
  });

  it('should reject room ID with invalid characters', () => {
    const result = validateRoomId('ABC-12');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Room ID must contain only letters and numbers');
  });

  it('should handle lowercase and trim whitespace', () => {
    expect(validateRoomId(' abc123 ').valid).toBe(true);
  });
});

describe('validatePlayerName', () => {
  it('should accept valid player names', () => {
    expect(validatePlayerName('Alice').valid).toBe(true);
    expect(validatePlayerName('Bob Smith').valid).toBe(true);
    expect(validatePlayerName('Player123').valid).toBe(true);
  });

  it('should reject empty name', () => {
    const result = validatePlayerName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Player name is required');
  });

  it('should reject name that is too short', () => {
    const result = validatePlayerName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Player name must be at least 2 characters');
  });

  it('should reject name that is too long', () => {
    const result = validatePlayerName('A'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Player name cannot exceed 20 characters');
  });

  it('should trim whitespace', () => {
    expect(validatePlayerName('  Alice  ').valid).toBe(true);
  });
});

describe('formatCardPlayError', () => {
  it('should format known error messages', () => {
    expect(formatCardPlayError('Must follow suit')).toBe(
      'You must play a card of the lead suit if you have one.'
    );
    expect(formatCardPlayError('Not your turn')).toBe(
      'Please wait for your turn to play.'
    );
  });

  it('should return original message for unknown errors', () => {
    expect(formatCardPlayError('Unknown error')).toBe('Unknown error');
  });
});
