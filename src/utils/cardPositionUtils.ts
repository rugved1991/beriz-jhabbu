import { CardPosition } from '../types';

/**
 * Generates a card position in one of 13 fixed slots on the table.
 * Cards are placed randomly in available slots, ensuring no overlap.
 * On mobile, cards are arranged in a grid pattern to fit the narrower screen.
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
  
  // Detect mobile screen size
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640; // sm breakpoint
  
  let slotPositions: Array<{ x: number; y: number }> = [];
  
  if (isMobile) {
    // Mobile: Arrange in a compact grid (4 columns x 4 rows, with 1 extra in last row)
    // Card width ~44px, use 50px spacing
    const cardSpacing = 50;
    const rowSpacing = 55; // Slightly more vertical spacing
    const cols = 4;
    const rows = Math.ceil(TOTAL_SLOTS / cols);
    
    // Calculate grid dimensions
    const gridWidth = (cols - 1) * cardSpacing;
    const gridHeight = (rows - 1) * rowSpacing;
    const startX = -(gridWidth / 2);
    const startY = -(gridHeight / 2);
    
    // Generate grid positions
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      slotPositions.push({
        x: startX + (col * cardSpacing),
        y: startY + (row * rowSpacing)
      });
    }
  } else {
    // Desktop: Arrange in a single horizontal row
    // Cards are ~60px wide, use 75px spacing to prevent overlap
    // Total width = 12 * 75 = 900px (fits well in 1000px table)
    const cardSpacing = 75;
    
    // Calculate start position to center all 13 slots
    const totalWidth = (TOTAL_SLOTS - 1) * cardSpacing;
    const startX = -(totalWidth / 2);
    
    // Calculate all slot positions (single row)
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      slotPositions.push({
        x: startX + (i * cardSpacing),
        y: 0
      });
    }
  }
  
  // Find occupied slots by checking existing positions
  const occupiedSlots = new Set<number>();
  existingPositions.forEach(pos => {
    // Find which slot this position corresponds to (with tolerance for floating point)
    const slotIndex = slotPositions.findIndex(slot => 
      Math.abs((pos.x - centerX) - slot.x) < 5 && 
      Math.abs((pos.y - centerY) - slot.y) < 5
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
  const selectedPosition = slotPositions[selectedSlot];
  const xOffset = selectedPosition.x;
  const yOffset = selectedPosition.y;
  
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
