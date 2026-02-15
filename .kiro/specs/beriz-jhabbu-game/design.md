# Beriz Jhabbu - Technical Design Document

## Architecture Overview

Beriz Jhabbu is built as a single-page React application with a component-based architecture. The game uses a centralized state management pattern with React hooks and implements a finite state machine for game phase transitions.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│  App.tsx (Main Game Controller)                            │
│  ├── GameSetup (Room Creation)                             │
│  ├── Lobby (Player Management)                             │
│  ├── Table (Game Board Display)                            │
│  ├── PlayerHand (Card Interaction)                         │
│  └── GameOver (Results Display)                            │
├─────────────────────────────────────────────────────────────┤
│  Game Logic Layer                                          │
│  ├── stateMachine.ts (Phase Transitions)                   │
│  ├── phase1Logic.ts (Beriz Rules)                          │
│  ├── phase2Logic.ts (Jhabbu Rules)                         │
│  ├── penaltyEngine.ts (Penalty Detection)                  │
│  ├── trickEngine.ts (Trick Resolution)                     │
│  └── botAI.ts (Computer Players)                           │
├─────────────────────────────────────────────────────────────┤
│  Utility Layer                                             │
│  ├── deckUtils.ts (Card Generation)                        │
│  ├── cardPositionUtils.ts (Visual Layout)                  │
│  ├── roomUtils.ts (Room Management)                        │
│  └── validation.ts (Input Validation)                      │
├─────────────────────────────────────────────────────────────┤
│  Type System (types/index.ts)                              │
│  ├── Core Types (Card, Player, GameState)                  │
│  ├── Game Phases (SETUP → LOBBY → BERIZ → JHABBU)         │
│  └── Result Types (PlayResult, EliminationResult)          │
└─────────────────────────────────────────────────────────────┘
```

## Core Design Patterns

### 1. Finite State Machine Pattern

The game uses a strict state machine to manage phase transitions:

```typescript
SETUP → LOBBY → DEALING → BERIZ → JHABBU → GAME_OVER
```

**Benefits:**
- Prevents invalid state transitions
- Ensures game integrity
- Simplifies debugging and testing
- Clear separation of phase-specific logic

**Implementation:**
- `stateMachine.ts` validates all transitions
- Each phase has dedicated validation rules
- Transition functions are pure and testable

### 2. Command Pattern for Card Plays

Card plays are handled through command objects that encapsulate:
- Player action
- Validation logic
- State updates
- Side effects

**Benefits:**
- Consistent error handling
- Easy to test and mock
- Supports undo/redo if needed
- Clear separation of concerns

### 3. Strategy Pattern for Bot AI

Different bot strategies for each game phase:
- Phase 1: Penalty avoidance strategy
- Phase 2: Suit following and Jhabbu timing strategy

**Benefits:**
- Pluggable AI behaviors
- Easy to test different strategies
- Supports difficulty levels
- Maintainable AI code

## Component Architecture

### Core Components

#### App.tsx (Main Controller)
**Responsibilities:**
- Central game state management
- Phase transition orchestration
- Bot AI coordination
- Event handling and routing

**Key State:**
```typescript
const [gameState, setGameState] = useState<GameState>()
const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>()
const [currentUserId, setCurrentUserId] = useState<string>()
```

#### Table.tsx (Game Board)
**Responsibilities:**
- Visual card layout and positioning
- Phase-specific display logic
- Player position management
- Animation coordination

**Key Features:**
- Messy pile layout for Phase 1
- Organized trick layout for Phase 2
- Player position indicators
- Dealer designation

#### PlayerHand.tsx (Card Interaction)
**Responsibilities:**
- Card selection and play
- Multi-card selection for Jhabbu
- Input validation and feedback
- Accessibility support

**Key Features:**
- Single-click for normal play
- Multi-select for Jhabbu Dump
- Visual feedback for valid/invalid plays
- Keyboard navigation support

### Utility Components

#### GameSetup.tsx
- Room creation interface
- Player count selection
- Room ID generation

#### Lobby.tsx
- Player joining interface
- Ready state management
- Game start controls

#### GameOver.tsx
- Results display
- Winner/loser announcement
- New game initiation

## Data Flow Architecture

### State Management Flow

```
User Action → Validation → Game Logic → State Update → UI Re-render
     ↓              ↓            ↓           ↓            ↓
Card Click → Check Rules → Apply Effects → Update State → Show Result
```

### Phase 1 (Beriz) Flow

```
1. Player plays card
2. Remove card from hand
3. Check for penalties (duplicate rank, sum match)
4. If penalty: collect cards to side deck
5. If no penalty: add card to table
6. Check phase completion
7. If complete: transition to Phase 2
8. Move to next player
```

### Phase 2 (Jhabbu) Flow

```
1. Player plays card(s)
2. Validate suit following rules
3. If multiple cards: validate Jhabbu rules
4. Add cards to current trick
5. Check if trick complete
6. If complete: determine Jhabbu Receiver
7. Distribute cards (discard or to Jhabbu Receiver)
8. Check for player elimination
9. Set next leader
```

## Game Logic Design

### Penalty Engine (Phase 1)

**Duplicate Rank Detection:**
```typescript
function checkDuplicateRank(playedCard: Card, tableCards: Card[]): Card[] | null {
  const matchingCards = tableCards.filter(card => card.rank === playedCard.rank)
  return matchingCards.length > 0 ? [playedCard, ...matchingCards] : null
}
```

**Sum Match Detection:**
```typescript
function checkSumMatch(playedCard: Card, tableCards: Card[]): Card[] | null {
  const targetValue = getCardValue(playedCard)
  const combinations = findSumCombinations(tableCards, targetValue)
  return combinations.length > 0 ? [playedCard, ...getBestCombination(combinations)] : null
}
```

### Trick Engine (Phase 2)

**Suit Following Validation:**
```typescript
function validateSuitFollowing(card: Card, hand: Card[], leadSuit: Suit): boolean {
  const hasLeadSuit = hand.some(c => c.suit === leadSuit)
  return !hasLeadSuit || card.suit === leadSuit
}
```

**Jhabbu Validation:**
```typescript
function validateJhabbu(cards: Card[], hand: Card[], leadSuit: Suit): boolean {
  // Must be void in lead suit
  const hasLeadSuit = hand.some(c => c.suit === leadSuit)
  if (hasLeadSuit) return false
  
  // All cards must be same suit (not lead suit)
  const jhabbuSuit = cards[0].suit
  return cards.every(c => c.suit === jhabbuSuit && c.suit !== leadSuit)
}
```

## Bot AI Design

### Phase 1 Strategy
**Penalty Avoidance:**
- Analyze table for potential penalties
- Choose card with lowest penalty risk
- Prefer cards that don't match existing ranks
- Avoid cards that create sum matches

### Phase 2 Strategy
**Suit Following & Jhabbu Timing:**
- Follow suit when required
- Use Jhabbu Dump when void and advantageous
- Consider opponent hand sizes
- Time Jhabbu to maximize impact

### Bot Delay System
```typescript
function getBotDelay(): number {
  return 1000 + Math.random() * 2000 // 1-3 seconds
}
```

## Animation & Visual Design

### Card Positioning System

**Phase 1 - Messy Pile:**
```typescript
interface CardPosition {
  x: number        // Random offset from center
  y: number        // Random offset from center  
  rotation: number // Random rotation (-15° to +15°)
  zIndex: number   // Stacking order
}
```

**Phase 2 - Organized Layout:**
- Cards arranged in player order
- Clear visual hierarchy
- Smooth transitions between states

### Animation Framework

**Framer Motion Integration:**
- Card play animations
- Phase transition effects
- Jhabbu announcement dramatics
- Smooth state changes

## Error Handling Strategy

### Validation Layers

1. **UI Validation:** Prevent invalid interactions
2. **Logic Validation:** Validate game rules
3. **State Validation:** Ensure state consistency
4. **Recovery Mechanisms:** Graceful error handling

### Error Types

**Game Logic Errors:**
- Invalid card plays
- Rule violations
- State inconsistencies

**UI Errors:**
- Invalid user interactions
- Component rendering issues
- Animation failures

**Bot AI Errors:**
- Strategy failures
- Timeout issues
- Logic exceptions

## Testing Strategy

### Unit Testing
- **Game Logic:** Pure function testing
- **Components:** React Testing Library
- **Utilities:** Jest unit tests

### Property-Based Testing
- **Card Generation:** Deck validity
- **Penalty Detection:** Rule consistency
- **State Transitions:** Invariant checking

### Integration Testing
- **Game Flow:** End-to-end scenarios
- **Bot Behavior:** AI decision validation
- **UI Interactions:** User journey testing

## Performance Considerations

### Optimization Strategies

**State Management:**
- Minimize re-renders with React.memo
- Use callback memoization
- Efficient state updates

**Card Rendering:**
- Virtual scrolling for large hands
- Lazy loading of card images
- Optimized animation performance

**Bot AI:**
- Async processing with timeouts
- Efficient algorithm implementations
- Memory management for large games

### Scalability Factors

**Player Count:** Supports 2-16 players efficiently
**Deck Size:** Handles multiple decks (up to 4 decks)
**Game Length:** Maintains performance throughout long games

## Security Considerations

### Client-Side Security
- Input validation and sanitization
- XSS prevention in user inputs
- Safe HTML rendering

### Game Integrity
- Deterministic random number generation
- Consistent rule enforcement
- Cheat prevention (single-device context)

## Accessibility Design

### WCAG Compliance
- **Keyboard Navigation:** Full keyboard support
- **Screen Readers:** ARIA labels and announcements
- **Visual Accessibility:** High contrast, clear fonts
- **Motor Accessibility:** Large click targets

### Inclusive Design
- **Color Blindness:** Suit symbols in addition to colors
- **Cognitive Load:** Clear game state indicators
- **Learning Curve:** Comprehensive rules and help

## Deployment Architecture

### Build Process
```bash
npm run build  # Production build with optimizations
```

### Static Hosting
- Optimized for CDN deployment
- Single-page application routing
- Asset optimization and compression

### Browser Support
- Modern browsers (ES2020+)
- Progressive enhancement
- Responsive design for multiple screen sizes

## Future Extensibility

### Planned Enhancements
- **Multiplayer Networking:** WebSocket integration
- **Game Variants:** Alternative rule sets
- **Advanced AI:** Machine learning bots
- **Statistics:** Game history and analytics

### Architecture Flexibility
- **Modular Design:** Easy to add new features
- **Plugin System:** Extensible bot strategies
- **Theme System:** Customizable visual themes
- **Rule Engine:** Configurable game rules