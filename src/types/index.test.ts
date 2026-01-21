import { Card, Player, GameState, Room, Suit, Rank, GamePhase } from './index';

describe('Type definitions', () => {
  it('should create a valid Card object', () => {
    const card: Card = {
      suit: 'hearts',
      rank: 'A',
      id: 'hearts-A-deck0'
    };

    expect(card.suit).toBe('hearts');
    expect(card.rank).toBe('A');
    expect(card.id).toBe('hearts-A-deck0');
  });

  it('should create a valid Player object', () => {
    const player: Player = {
      id: 'player-1',
      name: 'Alice',
      hand: [],
      sideDeck: [],
      isActive: true,
      isHost: true,
      position: 0
    };

    expect(player.id).toBe('player-1');
    expect(player.name).toBe('Alice');
    expect(player.isHost).toBe(true);
    expect(player.position).toBe(0);
  });

  it('should create a valid GameState object', () => {
    const gameState: GameState = {
      phase: 'SETUP',
      roomId: 'ABC123',
      hostId: 'player-1',
      maxPlayers: 4,
      players: [],
      currentPlayerIndex: 0,
      dealerId: '',
      table: [],
      leadSuit: null,
      trickCards: [],
      loser: null
    };

    expect(gameState.phase).toBe('SETUP');
    expect(gameState.roomId).toBe('ABC123');
    expect(gameState.maxPlayers).toBe(4);
  });

  it('should accept all valid suits', () => {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    suits.forEach(suit => {
      const card: Card = { suit, rank: 'A', id: `${suit}-A` };
      expect(card.suit).toBe(suit);
    });
  });

  it('should accept all valid ranks', () => {
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    ranks.forEach(rank => {
      const card: Card = { suit: 'hearts', rank, id: `hearts-${rank}` };
      expect(card.rank).toBe(rank);
    });
  });

  it('should accept all valid game phases', () => {
    const phases: GamePhase[] = ['SETUP', 'LOBBY', 'DEALING', 'BERIZ', 'JHABBU', 'GAME_OVER'];
    phases.forEach(phase => {
      const gameState: GameState = {
        phase,
        roomId: 'TEST',
        hostId: 'host',
        maxPlayers: 4,
        players: [],
        currentPlayerIndex: 0,
        dealerId: '',
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };
      expect(gameState.phase).toBe(phase);
    });
  });
});
