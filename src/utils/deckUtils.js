"use strict";
/**
 * Utility functions for deck management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDeckCount = calculateDeckCount;
exports.isValidPlayerCount = isValidPlayerCount;
exports.generateDecks = generateDecks;
exports.dealCards = dealCards;
/**
 * Calculates the number of decks needed based on player count
 * Formula: ceiling(N / 4)
 * @param playerCount - Number of players (must be between 2 and 16)
 * @returns Number of decks required
 */
function calculateDeckCount(playerCount) {
    return Math.ceil(playerCount / 4);
}
/**
 * Validates that player count is within acceptable range
 * @param playerCount - Number of players to validate
 * @returns true if player count is between 2 and 16 inclusive
 */
function isValidPlayerCount(playerCount) {
    return Number.isInteger(playerCount) && playerCount >= 2 && playerCount <= 16;
}
/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns A new shuffled array
 */
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
/**
 * Generates a complete card pool with the specified number of decks
 * @param deckCount - Number of standard 52-card decks to generate
 * @returns Shuffled array of cards
 */
function generateDecks(deckCount) {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const cards = [];
    for (let d = 0; d < deckCount; d++) {
        for (const suit of suits) {
            for (const rank of ranks) {
                cards.push({
                    suit,
                    rank,
                    id: `${suit}-${rank}-deck${d}`
                });
            }
        }
    }
    return shuffle(cards);
}
/**
 * Deals cards to players in round-robin order
 * Distributes all cards from the deck to players, with some players potentially
 * receiving one more card than others if cards don't divide evenly
 *
 * @param deck - Array of cards to deal (will be emptied)
 * @param playerCount - Number of players to deal to
 * @returns Array of card arrays, one for each player
 */
function dealCards(deck, playerCount) {
    // Initialize empty hands for each player
    const hands = Array.from({ length: playerCount }, () => []);
    // Deal cards in round-robin order
    let currentPlayerIndex = 0;
    while (deck.length > 0) {
        const card = deck.shift(); // Remove card from deck
        hands[currentPlayerIndex].push(card);
        currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
    }
    return hands;
}
//# sourceMappingURL=deckUtils.js.map