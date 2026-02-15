# Beriz Jhabbu - Game Requirements

## Project Overview

Beriz Jhabbu is a React-based web card game featuring two distinct gameplay phases: Beriz (addition phase) and Jhabbu (shedding phase). The game supports 2-16 players and uses multiple standard 52-card decks.

## Functional Requirements

### 1. Game Setup & Room Management

#### 1.1 Room Creation
- **REQ-1.1.1**: System shall allow host to create a game room for 2-16 players
- **REQ-1.1.2**: System shall generate unique room IDs using format: 3 uppercase letters + 3 digits
- **REQ-1.1.3**: System shall automatically calculate required deck count (1 deck per 4 players)

#### 1.2 Player Management
- **REQ-1.2.1**: System shall allow players to join rooms using room ID
- **REQ-1.2.2**: System shall support both human players and bot players
- **REQ-1.2.3**: System shall track player positions around the table (0 to N-1)
- **REQ-1.2.4**: System shall designate first player as host with game control privileges

### 2. Card Management

#### 2.1 Deck Generation
- **REQ-2.1.1**: System shall generate multiple standard 52-card decks based on player count
- **REQ-2.1.2**: Each card shall have unique identifier for React rendering
- **REQ-2.1.3**: System shall support suits: hearts, diamonds, clubs, spades
- **REQ-2.1.4**: System shall support ranks: A, 2-10, J, Q, K

#### 2.2 Card Dealing
- **REQ-2.2.1**: System shall deal all cards to players at game start
- **REQ-2.2.2**: System shall distribute cards as evenly as possible
- **REQ-2.2.3**: System shall rotate dealer position clockwise for subsequent games

### 3. Phase 1: Beriz (Addition Phase)

#### 3.1 Basic Gameplay
- **REQ-3.1.1**: Players shall take turns playing one card to center table
- **REQ-3.1.2**: Cards shall be placed randomly on table creating "messy pile"
- **REQ-3.1.3**: System shall check for penalties after each card play

#### 3.2 Penalty Detection
- **REQ-3.2.1**: **Duplicate Rank Penalty**: Player collects their card + matching rank cards from table
- **REQ-3.2.2**: **Sum Match Penalty**: Player collects their card + cards that sum to their card's value
  - Ace = 1, numbered cards = face value, face cards have no numeric value
  - If multiple sum combinations exist, collect the one with most cards
- **REQ-3.2.3**: Face cards (J, Q, K) shall only trigger duplicate rank penalties

#### 3.3 Penalty Card Management
- **REQ-3.3.1**: Collected penalty cards shall go to player's "side deck"
- **REQ-3.3.2**: Side deck shall be hidden from other players
- **REQ-3.3.3**: Side deck becomes player's hand in Phase 2

#### 3.4 Phase Completion
- **REQ-3.4.1**: Phase 1 ends when last player plays their final hand card
- **REQ-3.4.2**: Last player shall collect all remaining table cards
- **REQ-3.4.3**: System shall transition to Phase 2 with dramatic announcement

### 4. Phase 2: Jhabbu (Shedding Phase)

#### 4.1 Basic Gameplay
- **REQ-4.1.1**: Player's side deck becomes their hand
- **REQ-4.1.2**: Players play in rounds (tricks) following suit rules
- **REQ-4.1.3**: First player of round sets lead suit
- **REQ-4.1.4**: Players must follow lead suit if they have it

#### 4.2 Normal Rounds
- **REQ-4.2.1**: All players play one card following suit rules
- **REQ-4.2.2**: All cards are discarded (removed from game)
- **REQ-4.2.3**: Player with highest card of lead suit leads next round

#### 4.3 Jhabbu Dump Mechanism
- **REQ-4.3.1**: When void in lead suit, player can perform "Jhabbu Dump"
- **REQ-4.3.2**: Player selects all cards of another suit (minimum 2 cards)
- **REQ-4.3.3**: System automatically keeps lowest card for player
- **REQ-4.3.4**: Remaining cards become "Jhabbu" given to Jhabbu Receiver
- **REQ-4.3.5**: Player with highest card of lead suit becomes Jhabbu Receiver
- **REQ-4.3.6**: Jhabbu Receiver collects all cards from the round
- **REQ-4.3.7**: Jhabbu Giver leads next round with kept lowest card

#### 4.4 Special Cases
- **REQ-4.4.1**: Player can give Jhabbu with single card if it's their last card
- **REQ-4.4.2**: Multiple identical cards (different decks) - first player becomes Jhabbu Receiver
- **REQ-4.4.3**: If Jhabbu Giver eliminated, next active player leads

#### 4.5 Player Elimination
- **REQ-4.5.1**: Players with empty hands are eliminated (winners)
- **REQ-4.5.2**: Game continues with remaining active players
- **REQ-4.5.3**: Last player with cards is the loser

### 5. User Interface Requirements

#### 5.1 Game Board
- **REQ-5.1.1**: Display current phase prominently
- **REQ-5.1.2**: Show current player's turn
- **REQ-5.1.3**: Display room ID for sharing
- **REQ-5.1.4**: Show player positions around table

#### 5.2 Card Display
- **REQ-5.2.1**: Phase 1: Cards displayed in messy pile with random positions/rotations
- **REQ-5.2.2**: Phase 2: Cards displayed in organized trick layout
- **REQ-5.2.3**: Player hand displayed at bottom with card selection
- **REQ-5.2.4**: Support multi-card selection for Jhabbu Dump

#### 5.3 Game Feedback
- **REQ-5.3.1**: Display error messages for invalid plays
- **REQ-5.3.2**: Show dramatic "Jhabbu!!" announcement
- **REQ-5.3.3**: Display phase transition animations
- **REQ-5.3.4**: Show bot thinking indicators

#### 5.4 Rules & Help
- **REQ-5.4.1**: Provide accessible rules modal
- **REQ-5.4.2**: Include game phase explanations
- **REQ-5.4.3**: Show penalty rules and examples

### 6. Bot AI Requirements

#### 6.1 Bot Behavior
- **REQ-6.1.1**: Bots shall play automatically with realistic delays
- **REQ-6.1.2**: Phase 1: Bots select cards to minimize penalties
- **REQ-6.1.3**: Phase 2: Bots follow suit rules and use strategic Jhabbu Dumps
- **REQ-6.1.4**: Bots shall not block user interface during play

#### 6.2 Bot Intelligence
- **REQ-6.2.1**: Bots avoid obvious penalty situations when possible
- **REQ-6.2.2**: Bots use Jhabbu Dump strategically when void
- **REQ-6.2.3**: Bots consider card counting and suit distribution

### 7. Game State Management

#### 7.1 State Transitions
- **REQ-7.1.1**: SETUP → LOBBY → DEALING → BERIZ → JHABBU → GAME_OVER
- **REQ-7.1.2**: Validate all state transitions
- **REQ-7.1.3**: Support game restart from GAME_OVER

#### 7.2 Data Persistence
- **REQ-7.2.1**: Maintain game state during single session
- **REQ-7.2.2**: Track dealer rotation between games
- **REQ-7.2.3**: Preserve player positions and names

### 8. Performance Requirements

#### 8.1 Responsiveness
- **REQ-8.1.1**: Card plays shall respond within 100ms
- **REQ-8.1.2**: Bot moves shall complete within 1-3 seconds
- **REQ-8.1.3**: UI animations shall be smooth (60fps)

#### 8.2 Scalability
- **REQ-8.2.1**: Support up to 16 players without performance degradation
- **REQ-8.2.2**: Handle multiple deck scenarios efficiently
- **REQ-8.2.3**: Maintain responsive UI with large card counts

### 9. Accessibility Requirements

#### 9.1 Visual Accessibility
- **REQ-9.1.1**: Provide high contrast card designs
- **REQ-9.1.2**: Use clear, readable fonts
- **REQ-9.1.3**: Support screen reader navigation

#### 9.2 Interaction Accessibility
- **REQ-9.2.1**: Support keyboard navigation
- **REQ-9.2.2**: Provide ARIA labels for game elements
- **REQ-9.2.3**: Include status announcements for screen readers

### 10. Error Handling

#### 10.1 Game Logic Errors
- **REQ-10.1.1**: Validate all card plays before execution
- **REQ-10.1.2**: Provide clear error messages for invalid moves
- **REQ-10.1.3**: Gracefully handle edge cases and race conditions

#### 10.2 Recovery Mechanisms
- **REQ-10.2.1**: Allow game restart on critical errors
- **REQ-10.2.2**: Maintain game state consistency
- **REQ-10.2.3**: Provide fallback for bot AI failures

## Non-Functional Requirements

### 11. Technology Stack
- **REQ-11.1**: React 19 with TypeScript
- **REQ-11.2**: Tailwind CSS for styling
- **REQ-11.3**: Framer Motion for animations
- **REQ-11.4**: Jest and React Testing Library for testing

### 12. Browser Compatibility
- **REQ-12.1**: Support modern browsers (Chrome, Firefox, Safari, Edge)
- **REQ-12.2**: Responsive design for desktop and tablet
- **REQ-12.3**: Touch-friendly interface for mobile devices

### 13. Code Quality
- **REQ-13.1**: Maintain TypeScript strict mode compliance
- **REQ-13.2**: Achieve >80% test coverage
- **REQ-13.3**: Follow React best practices and patterns
- **REQ-13.4**: Use property-based testing for game logic