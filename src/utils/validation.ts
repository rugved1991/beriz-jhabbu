/**
 * Input validation utilities
 * Provides validation functions for player count, room IDs, and card plays
 */

/**
 * Validates player count is within acceptable range (2-16)
 * Requirements: 1.4
 */
export function validatePlayerCount(count: number): { valid: boolean; error?: string } {
  if (isNaN(count)) {
    return { valid: false, error: 'Player count must be a number' };
  }
  
  if (count < 2) {
    return { valid: false, error: 'Player count must be at least 2' };
  }
  
  if (count > 16) {
    return { valid: false, error: 'Player count cannot exceed 16' };
  }
  
  return { valid: true };
}

/**
 * Validates room ID format (6 alphanumeric characters)
 */
export function validateRoomId(roomId: string): { valid: boolean; error?: string } {
  if (!roomId || roomId.trim().length === 0) {
    return { valid: false, error: 'Room ID is required' };
  }
  
  const trimmedId = roomId.trim().toUpperCase();
  
  if (trimmedId.length !== 6) {
    return { valid: false, error: 'Room ID must be 6 characters' };
  }
  
  if (!/^[A-Z0-9]{6}$/.test(trimmedId)) {
    return { valid: false, error: 'Room ID must contain only letters and numbers' };
  }
  
  return { valid: true };
}

/**
 * Validates player name
 */
export function validatePlayerName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Player name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Player name must be at least 2 characters' };
  }
  
  if (name.trim().length > 20) {
    return { valid: false, error: 'Player name cannot exceed 20 characters' };
  }
  
  return { valid: true };
}

/**
 * Formats card play error messages for user display
 * Requirements: 9.2
 */
export function formatCardPlayError(error: string): string {
  const errorMessages: Record<string, string> = {
    'Player not found': 'Unable to find player. Please refresh the page.',
    'Card not in player hand': 'You cannot play a card that is not in your hand.',
    'Not your turn': 'Please wait for your turn to play.',
    'Must follow suit': 'You must play a card of the lead suit if you have one.',
    'Invalid Jhabbu play': 'Invalid Jhabbu: You can only play multiple cards when void in the lead suit.',
    'Cards not in player hand': 'One or more cards are not in your hand.'
  };
  
  return errorMessages[error] || error;
}
