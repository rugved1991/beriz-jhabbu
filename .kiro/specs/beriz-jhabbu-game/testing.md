# Beriz Jhabbu - Testing Strategy

## Testing Overview

The Beriz Jhabbu project employs a comprehensive testing strategy combining unit tests, integration tests, and property-based testing to ensure game logic correctness, UI reliability, and overall system stability.

## Current Testing Status

### ✅ Implemented Tests

#### Unit Tests (Jest + React Testing Library)
- [x] **Type Definitions**: `src/types/index.test.ts`
- [x] **Deck Utilities**: `src/utils/deckUtils.test.ts`
- [x] **Card Positioning**: `src/utils/cardPositionUtils.test.ts`
- [x] **Penalty Engine**: `src/utils/penaltyEngine.test.ts`
- [x] **Phase 1 Logic**: `src/utils/phase1Logic.test.ts`
- [x] **Phase 2 Logic**: `src/utils/phase2Logic.test.ts`
- [x] **Room Utilities**: `src/utils/roomUtils.test.ts`
- [x] **State Machine**: `src/utils/stateMachine.test.ts`
- [x] **Validation**: `src/utils/validation.test.ts`

#### Component Tests
- [x] **App Component**: `src/App.test.tsx`

### 📊 Test Coverage Analysis

**Current Coverage:**
- **Utilities**: ~85% line coverage
- **Game Logic**: ~90% line coverage
- **Components**: ~60% line coverage
- **Overall**: ~75% line coverage

**Coverage Goals:**
- **Target**: >80% overall coverage
- **Critical Path**: >95% for game logic
- **UI Components**: >70% for user interactions

## Testing Architecture

### Test Categories

#### 1. Unit Tests
**Purpose**: Test individual functions and modules in isolation
**Tools**: Jest, fast-check (property-based testing)
**Scope**: Utility functions, game logic, pure functions

#### 2. Component Tests
**Purpose**: Test React component behavior and user interactions
**Tools**: React Testing Library, Jest
**Scope**: Component rendering, user events, prop handling

#### 3. Integration Tests
**Purpose**: Test complete game flows and component interactions
**Tools**: React Testing Library, Jest
**Scope**: End-to-end game scenarios, state management

#### 4. Property-Based Tests
**Purpose**: Test game logic with generated inputs to find edge cases
**Tools**: fast-check
**Scope**: Card generation, penalty detection, state transitions

## Detailed Testing Strategy

### Game Logic Testing

#### Penalty Engine Tests
```typescript
describe('penaltyEngine', () => {
  describe('duplicate rank detection', () => {
    it('should detect single duplicate rank', () => {
      const playedCard = createCard('7', 'hearts');
      const tableCards = [createCard('7', 'spades'), createCard('K', 'clubs')];
      
      const penalty = checkPenalty(playedCard, tableCards);
      expect(penalty).toHaveLength(2);
      expect(penalty).toContainEqual(playedCard);
    });

    it('should detect multiple duplicate ranks', () => {
      const playedCard = createCard('A', 'hearts');
      const tableCards = [
        createCard('A', 'spades'),
        createCard('A', 'clubs'),
        createCard('K', 'diamonds')
      ];
      
      const penalty = checkPenalty(playedCard, tableCards);
      expect(penalty).toHaveLength(3); // played card + 2 matches
    });
  });

  describe('sum match detection', () => {
    it('should detect simple sum match', () => {
      const playedCard = createCard('7', 'hearts');
      const tableCards = [
        createCard('3', 'spades'),
        createCard('4', 'clubs')
      ];
      
      const penalty = checkPenalty(playedCard, tableCards);
      expect(penalty).toHaveLength(3); // 7 = 3 + 4
    });

    it('should choose combination with most cards', () => {
      const playedCard = createCard('10', 'hearts');
      const tableCards = [
        createCard('5', 'spades'),   // 10 = 5 + 5
        createCard('5', 'clubs'),
        createCard('2', 'diamonds'), // 10 = 2 + 3 + 5
        createCard('3', 'hearts'),
      ];
      
      const penalty = checkPenalty(playedCard, tableCards);
      expect(penalty).toHaveLength(4); // Should pick 3-card combination
    });
  });

  describe('face card handling', () => {
    it('should not trigger sum penalties for face cards', () => {
      const playedCard = createCard('J', 'hearts');
      const tableCards = [createCard('5', 'spades'), createCard('5', 'clubs')];
      
      const penalty = checkPenalty(playedCard, tableCards);
      expect(penalty).toBeNull(); // No sum match for face cards
    });
  });
});
```

#### Phase Logic Tests
```typescript
describe('phase1Logic', () => {
  describe('card play handling', () => {
    it('should handle normal card play without penalty', () => {
      const players = [createPlayer('player1', [createCard('7', 'hearts')])];
      const table = [createCard('K', 'spades')];
      
      const result = handlePhase1CardPlay(
        'player1',
        createCard('7', 'hearts'),
        players,
        table
      );
      
      expect(result.success).toBe(true);
      expect(result.penaltyCards).toBeUndefined();
      expect(result.updatedTable).toHaveLength(2);
      expect(result.updatedPlayers[0].hand).toHaveLength(0);
    });

    it('should handle penalty card collection', () => {
      const players = [createPlayer('player1', [createCard('7', 'hearts')])];
      const table = [createCard('7', 'spades')]; // Duplicate rank
      
      const result = handlePhase1CardPlay(
        'player1',
        createCard('7', 'hearts'),
        players,
        table
      );
      
      expect(result.success).toBe(true);
      expect(result.penaltyCards).toHaveLength(2);
      expect(result.updatedTable).toHaveLength(0); // Cards removed
      expect(result.updatedPlayers[0].sideDeck).toHaveLength(2);
    });
  });

  describe('phase completion', () => {
    it('should detect phase completion when all hands empty', () => {
      const players = [
        createPlayer('player1', []),
        createPlayer('player2', [])
      ];
      
      const isComplete = checkPhase1Completion(players);
      expect(isComplete).toBe(true);
    });

    it('should not complete when players have cards', () => {
      const players = [
        createPlayer('player1', []),
        createPlayer('player2', [createCard('K', 'hearts')])
      ];
      
      const isComplete = checkPhase1Completion(players);
      expect(isComplete).toBe(false);
    });
  });
});
```

### Property-Based Testing

#### Deck Generation Properties
```typescript
describe('deckUtils property tests', () => {
  it('should generate valid decks for any deck count', () => {
    fc.assert(fc.property(
      fc.integer(1, 4), // 1-4 decks
      (deckCount) => {
        const deck = generateDecks(deckCount);
        
        // Property: Correct total card count
        expect(deck).toHaveLength(deckCount * 52);
        
        // Property: All cards have unique IDs
        const ids = deck.map(c => c.id);
        expect(new Set(ids)).toHaveLength(deck.length);
        
        // Property: Correct suit distribution
        const suitCounts = countBySuit(deck);
        Object.values(suitCounts).forEach(count => {
          expect(count).toBe(deckCount * 13);
        });
        
        // Property: Correct rank distribution
        const rankCounts = countByRank(deck);
        Object.values(rankCounts).forEach(count => {
          expect(count).toBe(deckCount * 4);
        });
      }
    ));
  });

  it('should deal cards evenly', () => {
    fc.assert(fc.property(
      fc.integer(2, 16), // 2-16 players
      fc.integer(1, 4),  // 1-4 decks
      (playerCount, deckCount) => {
        const deck = generateDecks(deckCount);
        const hands = dealCards(deck, playerCount);
        
        // Property: All cards distributed
        const totalCards = hands.reduce((sum, hand) => sum + hand.length, 0);
        expect(totalCards).toBe(deck.length);
        
        // Property: Even distribution (max difference of 1)
        const handSizes = hands.map(hand => hand.length);
        const minSize = Math.min(...handSizes);
        const maxSize = Math.max(...handSizes);
        expect(maxSize - minSize).toBeLessThanOrEqual(1);
        
        // Property: No duplicate cards across hands
        const allCards = hands.flat();
        const cardIds = allCards.map(c => c.id);
        expect(new Set(cardIds)).toHaveLength(allCards.length);
      }
    ));
  });
});
```

#### Game Logic Properties
```typescript
describe('penalty engine properties', () => {
  it('should maintain penalty consistency', () => {
    fc.assert(fc.property(
      fc.array(cardGenerator(), 1, 10), // Random table cards
      cardGenerator(),                   // Random played card
      (tableCards, playedCard) => {
        const penalty1 = checkPenalty(playedCard, tableCards);
        const penalty2 = checkPenalty(playedCard, tableCards);
        
        // Property: Deterministic results
        expect(penalty1).toEqual(penalty2);
        
        if (penalty1) {
          // Property: Penalty always includes played card
          expect(penalty1).toContainEqual(playedCard);
          
          // Property: All penalty cards were on table or played
          const allCards = [...tableCards, playedCard];
          penalty1.forEach(card => {
            expect(allCards).toContainEqual(card);
          });
        }
      }
    ));
  });
});
```

### Component Testing

#### Player Hand Component
```typescript
describe('PlayerHand', () => {
  const mockPlayer = {
    id: 'player1',
    name: 'Test Player',
    hand: [
      createCard('A', 'hearts'),
      createCard('K', 'spades'),
      createCard('7', 'clubs')
    ],
    sideDeck: [],
    isActive: true,
    isHost: false,
    position: 0
  };

  it('should render all cards in hand', () => {
    render(
      <PlayerHand
        player={mockPlayer}
        isCurrentPlayer={true}
        onPlayCard={jest.fn()}
        phase="BERIZ"
        gameState={mockGameState}
      />
    );

    expect(screen.getByText('A♥')).toBeInTheDocument();
    expect(screen.getByText('K♠')).toBeInTheDocument();
    expect(screen.getByText('7♣')).toBeInTheDocument();
  });

  it('should handle single card selection', () => {
    const mockOnPlayCard = jest.fn();
    
    render(
      <PlayerHand
        player={mockPlayer}
        isCurrentPlayer={true}
        onPlayCard={mockOnPlayCard}
        phase="BERIZ"
        gameState={mockGameState}
      />
    );

    fireEvent.click(screen.getByText('A♥'));
    expect(mockOnPlayCard).toHaveBeenCalledWith(mockPlayer.hand[0]);
  });

  it('should support multi-card selection in Phase 2', () => {
    const mockOnPlayCard = jest.fn();
    
    render(
      <PlayerHand
        player={mockPlayer}
        isCurrentPlayer={true}
        onPlayCard={mockOnPlayCard}
        phase="JHABBU"
        gameState={mockGameState}
      />
    );

    // Select multiple cards
    fireEvent.click(screen.getByText('A♥'));
    fireEvent.click(screen.getByText('K♠'));
    
    // Play selected cards
    fireEvent.click(screen.getByText('Play Selected'));
    
    expect(mockOnPlayCard).toHaveBeenCalledWith([
      mockPlayer.hand[0],
      mockPlayer.hand[1]
    ]);
  });

  it('should disable interaction when not current player', () => {
    render(
      <PlayerHand
        player={mockPlayer}
        isCurrentPlayer={false}
        onPlayCard={jest.fn()}
        phase="BERIZ"
        gameState={mockGameState}
      />
    );

    const cardButtons = screen.getAllByRole('button');
    cardButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
```

### Integration Testing

#### Complete Game Flow
```typescript
describe('Game Integration', () => {
  it('should complete a full game cycle', async () => {
    render(<App />);
    
    // Setup phase
    fireEvent.change(screen.getByLabelText('Number of players'), {
      target: { value: '2' }
    });
    fireEvent.click(screen.getByText('Create Room'));
    
    // Lobby phase
    fireEvent.change(screen.getByLabelText('Player name'), {
      target: { value: 'Player 1' }
    });
    fireEvent.click(screen.getByText('Join Game'));
    
    // Add bot player
    fireEvent.click(screen.getByText('Add Bot'));
    
    // Start game
    fireEvent.click(screen.getByText('Start Game'));
    
    // Verify Phase 1 started
    expect(screen.getByText('Phase 1: Beriz')).toBeInTheDocument();
    
    // Play through Phase 1 (simplified)
    // ... card play interactions ...
    
    // Verify Phase 2 transition
    await waitFor(() => {
      expect(screen.getByText('Phase 2: Jhabbu')).toBeInTheDocument();
    });
    
    // Play through Phase 2
    // ... more interactions ...
    
    // Verify game completion
    await waitFor(() => {
      expect(screen.getByText('Game Over')).toBeInTheDocument();
    });
  });
});
```

## Test Utilities

### Test Helpers
```typescript
// Test utility functions
export function createCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    id: `${rank}-${suit}-${Math.random()}`
  };
}

export function createPlayer(id: string, hand: Card[]): Player {
  return {
    id,
    name: `Player ${id}`,
    hand,
    sideDeck: [],
    isActive: true,
    isHost: false,
    position: 0
  };
}

export function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'SETUP',
    roomId: 'TEST123',
    hostId: 'host1',
    maxPlayers: 4,
    players: [],
    currentPlayerIndex: 0,
    dealerId: '',
    table: [],
    leadSuit: null,
    trickCards: [],
    loser: null,
    ...overrides
  };
}
```

### Mock Generators
```typescript
// Property-based test generators
const suitGenerator = () => fc.constantFrom('hearts', 'diamonds', 'clubs', 'spades');
const rankGenerator = () => fc.constantFrom('A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K');

const cardGenerator = () => fc.record({
  suit: suitGenerator(),
  rank: rankGenerator(),
  id: fc.string()
});

const playerGenerator = () => fc.record({
  id: fc.string(),
  name: fc.string(),
  hand: fc.array(cardGenerator(), 0, 13),
  sideDeck: fc.array(cardGenerator(), 0, 20),
  isActive: fc.boolean(),
  isHost: fc.boolean(),
  position: fc.integer(0, 15)
});
```

## Testing Best Practices

### Test Organization
- **Describe blocks**: Group related tests logically
- **Test names**: Use descriptive, behavior-focused names
- **Setup/Teardown**: Use beforeEach/afterEach for common setup
- **Test isolation**: Each test should be independent

### Assertion Strategies
- **Specific assertions**: Test exact expected values
- **Behavior verification**: Focus on what the code should do
- **Error cases**: Test both success and failure paths
- **Edge cases**: Test boundary conditions

### Performance Testing
- **Large games**: Test with maximum players (16)
- **Long games**: Test extended gameplay scenarios
- **Memory usage**: Monitor for memory leaks
- **Animation performance**: Test smooth 60fps animations

## Continuous Integration

### Test Automation
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:ci": "CI=true react-scripts test --coverage --watchAll=false"
  }
}
```

### Coverage Requirements
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      },
      "./src/utils/": {
        "branches": 90,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

## Testing Roadmap

### Phase 1: Foundation (Current)
- [x] Core utility function tests
- [x] Basic component tests
- [x] Property-based testing setup

### Phase 2: Expansion
- [ ] Complete component test coverage
- [ ] Integration test scenarios
- [ ] Performance benchmarking
- [ ] Accessibility testing

### Phase 3: Advanced
- [ ] Visual regression testing
- [ ] Load testing for large games
- [ ] Cross-browser testing
- [ ] Mobile device testing

This comprehensive testing strategy ensures the Beriz Jhabbu game is reliable, maintainable, and provides an excellent user experience across all scenarios.