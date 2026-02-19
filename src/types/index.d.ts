export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type GamePhase = 'SETUP' | 'LOBBY' | 'DEALING' | 'BERIZ' | 'JHABBU' | 'GAME_OVER';
export interface Card {
    suit: Suit;
    rank: Rank;
    id: string;
}
export interface Player {
    id: string;
    name: string;
    hand: Card[];
    sideDeck: Card[];
    isActive: boolean;
    isHost: boolean;
    position: number;
    finishPosition?: number;
}
export interface CardPosition {
    x: number;
    y: number;
    rotation: number;
    zIndex: number;
}
export interface TrickCard {
    card: Card;
    playerId: string;
}
export interface GameState {
    phase: GamePhase;
    roomId: string;
    hostId: string;
    maxPlayers: number;
    players: Player[];
    currentPlayerIndex: number;
    dealerId: string;
    table: Card[];
    leadSuit: Suit | null;
    trickCards: TrickCard[];
    loser: string | null;
}
export interface Room {
    id: string;
    hostId: string;
    maxPlayers: number;
    players: Player[];
    gameState: GameState;
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map