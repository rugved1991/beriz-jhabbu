import { CardPosition } from '../types';

/**
 * Generates a card position for a visible spread on the table.
 * Cards are placed in one of 13 fixed slots, randomly selected from available slots.
 * 
 * @param existingPositions - Array of existing card positions to determine occupied slots
 * @param centerX - X coordinate of table center (default: 0, relative positioning)
 * @param centerY - Y coordinate of table center (default: 0, relative positioning)
 * @returns CardPosition object with position in one of 13 slots and incremented z-index
 * 
 * Requirements:
 * - 3.1: Position cards in fixed slots for complete visibility
 * - 3.2: No overlap between cards (13 fixed slots with 70px spacing)
 * - 3.3: Z-index increments for each new card
 */
export function generateCardPosition(
  existingPositions: CardPosition[],
  centerX: number = 0,
  centerY: number = 0
): CardPosition {
  // Define 13 fixed slots to accommodate a full hand
  const TOTAL_SLOTS = 13;
  
  // Optimal spacing for 13 cards to fit on screen
  // Cards are 48-64px wide, use 70px spacing (small gap between cards)
  // Total width = 12 * 70 = 840px (fits on most screens)
  const cardSpacing = 70; // 70px between each slot center
  
  // Calculate start position to center all 13 slots
  // Total width = (TOTAL_SLOTS - 1) * cardSpacing = 12 * 70 = 840px
  // Start at -(total width / 2) = -420px
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
    // Find which slot this position corresponds to
    const slotIndex = slotPositions.findIndex(slotX => 
      Math.abs((pos.x - centerX) - slotX) < 1 // Allow for floating point precision
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
  
  // If no slots available (all 13 slots filled)
  // fall back to wrapping around
  let selectedSlot: number;
  if (availableSlots.length === 0) {
    selectedSlot = existingPositions.length % TOTAL_SLOTS;
  } else {
    // Randomly select from available slots
    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    selectedSlot = availableSlots[randomIndex];
  }
  
  // Position this card in the selected slot
  const xOffset = slotPositions[selectedSlot];
  const yOffset = 0; // Keep all cards at same vertical level
  
  // No rotation to prevent any overlap
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
