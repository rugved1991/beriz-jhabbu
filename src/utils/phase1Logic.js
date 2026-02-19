"use strict";
/**
 * Phase 1 (Beriz) game logic
 * Handles card play, penalty detection, and phase completion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePhase1CardPlay = handlePhase1CardPlay;
exports.checkPhase1Completion = checkPhase1Completion;
exports.handlePhase1Completion = handlePhase1Completion;
const penaltyEngine_1 = require("./penaltyEngine");
/**
 * Handles a card play in Phase 1 (Beriz).
 * Validates the card play, checks for penalties, moves penalty cards to side deck,
 * and updates the table state.
 *
 * @param playerId - ID of the player playing the card
 * @param card - The card being played
 * @param players - Current array of players
 * @param table - Current cards on the table
 * @returns Result object with updated game state
 */
function handlePhase1CardPlay(playerId, card, players, table) {
    // Find the player
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
        return {
            success: false,
            error: 'Player not found',
            updatedPlayers: players,
            updatedTable: table,
            phase1Complete: false
        };
    }
    const player = players[playerIndex];
    // Validate that the card is in the player's hand
    const cardIndex = player.hand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) {
        return {
            success: false,
            error: 'Card not in player hand',
            updatedPlayers: players,
            updatedTable: table,
            phase1Complete: false
        };
    }
    // Check for penalties
    const penaltyCards = (0, penaltyEngine_1.checkPenalty)(card, table);
    // Debug logging
    console.log('Phase 1 Card Play Debug:', {
        playedCard: `${card.rank}${card.suit}`,
        tableCards: table.map(c => `${c.rank}${c.suit}`),
        penaltyDetected: penaltyCards !== null,
        penaltyCards: penaltyCards?.map(c => `${c.rank}${c.suit}`)
    });
    // Create updated players array
    const updatedPlayers = players.map((p, idx) => {
        if (idx !== playerIndex) {
            return p;
        }
        // Remove the played card from hand
        const newHand = p.hand.filter(c => c.id !== card.id);
        if (penaltyCards) {
            // Penalty occurred - add penalty cards to side deck
            return {
                ...p,
                hand: newHand,
                sideDeck: [...p.sideDeck, ...penaltyCards]
            };
        }
        else {
            // No penalty - just remove card from hand
            return {
                ...p,
                hand: newHand
            };
        }
    });
    // Update table
    let updatedTable;
    if (penaltyCards) {
        // Remove penalty cards from table (all except the played card)
        const penaltyCardIds = new Set(penaltyCards.map(c => c.id));
        updatedTable = table.filter(c => !penaltyCardIds.has(c.id));
    }
    else {
        // No penalty - add card to table
        updatedTable = [...table, card];
    }
    // Check if Phase 1 is complete
    const phase1Complete = checkPhase1Completion(updatedPlayers);
    // Debug logging for phase completion
    if (phase1Complete) {
        console.log('Phase 1 Complete Check:', {
            allPlayersHandSizes: updatedPlayers.map(p => ({ name: p.name, handSize: p.hand.length }))
        });
    }
    return {
        success: true,
        penaltyCards: penaltyCards || undefined,
        updatedPlayers,
        updatedTable,
        phase1Complete
    };
}
/**
 * Checks if Phase 1 is complete (all players have empty hands).
 *
 * @param players - Array of players
 * @returns true if all players have empty hands, false otherwise
 */
function checkPhase1Completion(players) {
    return players.every(player => player.hand.length === 0);
}
/**
 * Handles Phase 1 completion by moving all remaining table cards to the last player
 * who played a card (the player who emptied their hand last).
 *
 * @param lastPlayerId - ID of the last player who played a card
 * @param players - Current array of players
 * @param table - Current cards on the table
 * @returns Updated players array with table cards moved to last player's side deck
 */
function handlePhase1Completion(lastPlayerId, players, table) {
    // If table is empty, no cards to move
    if (table.length === 0) {
        return players;
    }
    // Find the last player
    const playerIndex = players.findIndex(p => p.id === lastPlayerId);
    if (playerIndex === -1) {
        return players;
    }
    // Move all table cards to the last player's side deck
    return players.map((p, idx) => {
        if (idx !== playerIndex) {
            return p;
        }
        return {
            ...p,
            sideDeck: [...p.sideDeck, ...table]
        };
    });
}
//# sourceMappingURL=phase1Logic.js.map