// Shared type definitions for Beriz Jhabbu card game
// Note: These types are duplicated from ../src/types/index.ts to avoid TypeScript compilation issues
// Keep these in sync with the client types

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type GamePhase = 'SETUP' | 'LOBBY' | 'DEALING' | 'BERIZ' | 'JHABBU' | 'GAME_OVER';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Unique identifier for React keys
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  sideDeck: Card[];
  isActive: boolean;
  isHost: boolean;
  isConnected?: boolean; // Whether player is currently connected (undefined = connected for backward compatibility)
  position: number; // Position around the table (0 to N-1)
  finishPosition?: number; // Order of finishing (1 = first to finish, undefined = still playing or loser)
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
  dealerId: string; // ID of the dealer
  table: Card[];
  leadSuit: Suit | null;
  trickCards: TrickCard[];
  loser: string | null;
  jhabbuAnnouncement?: {
    jhabbuGiverId: string;
    jhabbuReceiverId: string;
    cardCount: number;
    keptCardId?: string; // ID of the lowest card kept by Jhabbu giver
    givenSuit?: string; // Suit of cards given in Jhabbu
    leadSuit?: string; // Lead suit of the trick
  } | null;
}

export interface Room {
  id: string;
  hostId: string;
  maxPlayers: number;
  players: Player[];
  gameState: GameState;
  createdAt: Date;
}
