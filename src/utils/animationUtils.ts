// Animation utilities for card movements in Beriz Jhabbu

import { AnimationType } from '../components/Card';

/**
 * Animation configuration for different card movements
 */
export interface AnimationConfig {
  duration: number; // Duration in milliseconds
  delay?: number; // Optional delay before animation starts
}

/**
 * Default animation configurations for each animation type
 */
export const ANIMATION_CONFIGS: Record<AnimationType, AnimationConfig> = {
  play: {
    duration: 400, // Card play animation (hand to table)
    delay: 0
  },
  'collect-penalty': {
    duration: 500, // Penalty collection animation (table to side deck)
    delay: 100 // Small delay to show the penalty trigger
  },
  'collect-trick': {
    duration: 600, // Trick collection animation (table to hand)
    delay: 200 // Delay to show trick completion
  },
  none: {
    duration: 0,
    delay: 0
  }
};

/**
 * Creates a map of card IDs to animation types
 * @param cardIds - Array of card IDs to animate
 * @param animationType - Type of animation to apply
 * @returns Map of card ID to animation type
 */
export function createAnimationMap(
  cardIds: string[],
  animationType: AnimationType
): Map<string, AnimationType> {
  const animationMap = new Map<string, AnimationType>();
  cardIds.forEach(id => {
    animationMap.set(id, animationType);
  });
  return animationMap;
}

/**
 * Calculates total animation time including delay
 * @param animationType - Type of animation
 * @returns Total time in milliseconds
 */
export function getAnimationDuration(animationType: AnimationType): number {
  const config = ANIMATION_CONFIGS[animationType];
  return config.duration + (config.delay || 0);
}

/**
 * Creates a promise that resolves after animation completes
 * @param animationType - Type of animation
 * @returns Promise that resolves after animation duration
 */
export function waitForAnimation(animationType: AnimationType): Promise<void> {
  const duration = getAnimationDuration(animationType);
  return new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * Batches multiple animations with staggered delays
 * @param cardIds - Array of card IDs to animate
 * @param animationType - Type of animation to apply
 * @param staggerDelay - Delay between each card animation in ms
 * @returns Map of card ID to animation type with staggered timing
 */
export function createStaggeredAnimationMap(
  cardIds: string[],
  animationType: AnimationType,
  staggerDelay: number = 50
): Map<string, AnimationType> {
  // For now, return simple map - staggering can be implemented in future
  // by extending AnimationType to include timing information
  return createAnimationMap(cardIds, animationType);
}

/**
 * Animation state manager for tracking ongoing animations
 */
export class AnimationManager {
  private activeAnimations: Set<string> = new Set();
  private completionCallbacks: Map<string, () => void> = new Map();

  /**
   * Registers an animation as active
   * @param cardId - ID of the card being animated
   * @param onComplete - Optional callback when animation completes
   */
  startAnimation(cardId: string, onComplete?: () => void): void {
    this.activeAnimations.add(cardId);
    if (onComplete) {
      this.completionCallbacks.set(cardId, onComplete);
    }
  }

  /**
   * Marks an animation as complete
   * @param cardId - ID of the card that finished animating
   */
  completeAnimation(cardId: string): void {
    this.activeAnimations.delete(cardId);
    const callback = this.completionCallbacks.get(cardId);
    if (callback) {
      callback();
      this.completionCallbacks.delete(cardId);
    }
  }

  /**
   * Checks if any animations are currently active
   * @returns True if animations are in progress
   */
  hasActiveAnimations(): boolean {
    return this.activeAnimations.size > 0;
  }

  /**
   * Waits for all active animations to complete
   * @returns Promise that resolves when all animations finish
   */
  async waitForAllAnimations(): Promise<void> {
    return new Promise(resolve => {
      if (!this.hasActiveAnimations()) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (!this.hasActiveAnimations()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Clears all active animations and callbacks
   */
  reset(): void {
    this.activeAnimations.clear();
    this.completionCallbacks.clear();
  }
}
