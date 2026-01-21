/**
 * Utility functions for room management
 */

/**
 * Generates a unique 6-character alphanumeric room ID
 * @returns A random room ID (e.g., "A3X9K2")
 */
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validates that a room ID has the correct format
 * @param roomId - The room ID to validate
 * @returns true if the room ID is valid (6 alphanumeric characters)
 */
export function isValidRoomId(roomId: string): boolean {
  return /^[A-Z0-9]{6}$/.test(roomId);
}
