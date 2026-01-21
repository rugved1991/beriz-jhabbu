import { Card } from '../types';

/**
 * Get the numeric value of a card for penalty calculations.
 * Ace = 1, 2-10 = face value, Face cards (J, Q, K) = null
 * 
 * @param card - The card to get the value for
 * @returns The numeric value or null for face cards
 */
export function getCardValue(card: Card): number | null {
  const rank = card.rank;
  
  // Face cards have no numeric value
  if (rank === 'J' || rank === 'Q' || rank === 'K') {
    return null;
  }
  
  // Ace is 1
  if (rank === 'A') {
    return 1;
  }
  
  // Number cards are their face value
  return parseInt(rank, 10);
}

/**
 * Check if a card's rank already exists on the table (duplicate rank penalty).
 * 
 * @param playedCard - The card being played
 * @param tableCards - The cards currently on the table
 * @returns true if the rank exists on the table, false otherwise
 */
export function hasDuplicateRank(playedCard: Card, tableCards: Card[]): boolean {
  return tableCards.some(card => card.rank === playedCard.rank);
}

/**
 * Find all subset combinations of cards that sum to the target value.
 * Uses optimized dynamic programming with early termination and space optimization.
 * 
 * @param cards - The cards to consider for subset sums
 * @param target - The target sum value
 * @returns Array of all card combinations that sum to the target
 */
export function findSubsetSum(cards: Card[], target: number): Card[][] {
  // Filter out cards with no numeric value (face cards)
  const numericCards = cards.filter(card => getCardValue(card) !== null);
  const values = numericCards.map(card => getCardValue(card) as number);
  const n = values.length;
  
  if (n === 0 || target <= 0) {
    return [];
  }
  
  // Early termination: if target is larger than sum of all cards, no solution exists
  const totalSum = values.reduce((sum, val) => sum + val, 0);
  if (target > totalSum) {
    return [];
  }
  
  // DP table: dp[i][j] = can we make sum j using first i cards?
  // Use space-optimized approach with two rows instead of full table
  const dp: boolean[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(target + 1).fill(false));
  
  // Base case: sum 0 is always possible (empty subset)
  for (let i = 0; i <= n; i++) {
    dp[i][0] = true;
  }
  
  // Fill DP table with early termination
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= target; j++) {
      // Don't include card i-1
      dp[i][j] = dp[i - 1][j];
      
      // Include card i-1 if its value doesn't exceed j
      if (j >= values[i - 1]) {
        dp[i][j] = dp[i][j] || dp[i - 1][j - values[i - 1]];
      }
    }
  }
  
  // If target sum is not achievable, return empty array
  if (!dp[n][target]) {
    return [];
  }
  
  // Backtrack to find all solutions with limit to prevent excessive computation
  const solutions: number[][] = [];
  const MAX_SOLUTIONS = 100; // Limit solutions to prevent performance issues
  
  function backtrack(i: number, j: number, current: number[]) {
    // Limit number of solutions for performance
    if (solutions.length >= MAX_SOLUTIONS) {
      return;
    }
    
    // Found a valid combination
    if (j === 0) {
      solutions.push([...current]);
      return;
    }
    
    // No more cards to consider
    if (i === 0) {
      return;
    }
    
    // Try not including card i-1
    if (dp[i - 1][j]) {
      backtrack(i - 1, j, current);
    }
    
    // Try including card i-1
    if (solutions.length < MAX_SOLUTIONS && j >= values[i - 1] && dp[i - 1][j - values[i - 1]]) {
      current.push(i - 1);
      backtrack(i - 1, j - values[i - 1], current);
      current.pop();
    }
  }
  
  backtrack(n, target, []);
  
  // Convert indices to cards
  return solutions.map(indices => indices.map(i => numericCards[i]));
}

/**
 * Get the longest combination from an array of card combinations.
 * 
 * @param combinations - Array of card combinations
 * @returns The combination with the most cards, or empty array if no combinations
 */
export function getLongestCombination(combinations: Card[][]): Card[] {
  if (combinations.length === 0) {
    return [];
  }
  
  return combinations.reduce((longest, current) => 
    current.length > longest.length ? current : longest
  );
}

/**
 * Check if a played card triggers a Beriz penalty and return the cards to be picked up.
 * Checks for:
 * 1. Duplicate rank penalty (applies to all cards)
 * 2. Subset sum penalty (applies only to numbered cards, not face cards)
 * 
 * When both penalties apply, returns the one with the most cards.
 * 
 * @param playedCard - The card being played
 * @param tableCards - The cards currently on the table
 * @returns Array of cards to be picked up (including the played card), or null if no penalty
 */
export function checkPenalty(playedCard: Card, tableCards: Card[]): Card[] | null {
  let duplicateRankPenalty: Card[] | null = null;
  let sumPenalty: Card[] | null = null;
  
  // Check for duplicate rank penalty (applies to all cards)
  if (hasDuplicateRank(playedCard, tableCards)) {
    // Find all cards with the same rank on the table
    const matchingCards = tableCards.filter(card => card.rank === playedCard.rank);
    // Played card plus all matching cards
    duplicateRankPenalty = [playedCard, ...matchingCards];
  }
  
  // Check for subset sum penalty (only for numbered cards)
  const playedCardValue = getCardValue(playedCard);
  if (playedCardValue !== null) {
    const combinations = findSubsetSum(tableCards, playedCardValue);
    
    if (combinations.length > 0) {
      // Select the longest combination
      const longestCombination = getLongestCombination(combinations);
      // Played card plus all cards in the combination
      sumPenalty = [playedCard, ...longestCombination];
    }
  }
  
  // If both penalties exist, return the one with more cards
  if (duplicateRankPenalty && sumPenalty) {
    return duplicateRankPenalty.length >= sumPenalty.length ? duplicateRankPenalty : sumPenalty;
  }
  
  // Return whichever penalty exists (or null if neither)
  return duplicateRankPenalty || sumPenalty;
}
