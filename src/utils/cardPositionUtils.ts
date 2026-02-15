import { CardPosition } from '../types';

/**
 * Generates a card position in one of 13 fixed slots on the table.
 * Cards are placed randomly in available slots, ensuring no overlap.
 * 
 * @param existingPositions - Array of existing card positions to determine occupied slots
 * @param centerX - X coordinate of table center (default: 0, relative positioning)
 * @param centerY - Y coordinate of table center (default: 0, relative positioning)
 * @returns CardPosition object with position in an available slot and incremented z-index
 */
export function generateCardPosition(
  existingPositions: CardPosition[],
  centerX: number = 0,
  centerY: number = 0
): CardPosition {
  // Define 13 fixed slots to accommodate a full hand
  const TOTAL_SLOTS = 13;
  
  // Spacing for 13 cards with wider table (1000px)
  // Cards are ~60px wide, use 75px spacing to prevent overlap
  // Total width = 12 * 75 = 900px (fits well in 1000px table)
  const cardSpacing = 75;
  
  // Calculate start position to center all 13 slots
  const totalWidth = (TOTAL_SLOTS - 1) * cardSpacing;
  const startX = -(totalWidth / 2);
  
  // Calculate all slot positions
  const slotPositions: number[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    slotPositions.push(startX + (i * cardSpacing));
  }
  
  // Find occupied slots by checking existing x positions
  const occupiedSlots = new Set<number>();
  existingPositions.forEach(pos => {
    // Find which slot this position corresponds to (with tolerance for floating point)
    const slotIndex = slotPositions.findIndex(slotX => 
      Math.abs((pos.x - centerX) - slotX) < 5
    );
    if (slotIndex !== -1) {
      occupiedSlots.add(slotIndex);
    }
  });
  
  // Find available slots
  const availableSlots: number[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    if (!occupiedSlots.has(i)) {
      availableSlots.push(i);
    }
  }
  
  // Select a random available slot
  let selectedSlot: number;
  if (availableSlots.length > 0) {
    // Randomly select from available slots
    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    selectedSlot = availableSlots[randomIndex];
  } else {
    // All slots filled - wrap around (shouldn't happen with 13 slots)
    selectedSlot = existingPositions.length % TOTAL_SLOTS;
  }
  
  // Position this card in the selected slot
  const xOffset = slotPositions[selectedSlot];
  const yOffset = 0; // Keep all cards at same vertical level
  
  // No rotation to keep cards aligned
  const rotation = 0;
  
  // Calculate z-index as length of existing positions + 1
  const zIndex = existingPositions.length + 1;
  
  return {
    x: centerX + xOffset,
    y: centerY + yOffset,
    rotation,
    zIndex
  };
}
