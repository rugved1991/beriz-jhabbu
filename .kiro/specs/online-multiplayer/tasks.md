# Implementation Plan: Online Multiplayer for Beriz Jhabbu

## Overview

This implementation plan transforms Beriz Jhabbu into an online multiplayer game by adding a Node.js backend server with WebSocket support. The plan follows an incremental approach, building and testing each component before moving to the next. The existing game logic and UI components are preserved, with a new network layer added for real-time synchronization.

## Tasks

- [x] 1. Setup backend project structure and dependencies
  - Create `server` directory in project root
  - Initialize separate `package.json` for server with Express, Socket.io, TypeScript
  - Configure TypeScript for server (`tsconfig.json` in server directory)
  - Add build scripts for server compilation
  - Create basic server entry point that starts HTTP and WebSocket servers
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Implement Room Manager
  - [x] 2.1 Create RoomManager class with in-memory room storage
    - Implement room creation with unique ID generation
    - Implement room retrieval and deletion methods
    - Implement player add/remove methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.6_
  
  - [x]* 2.2 Write property tests for Room Manager
    - **Property 2: Room ID Uniqueness** - Test that generating multiple room IDs produces unique values
    - **Property 3: Room Creator is Host** - Test that room creator is always marked as host
    - **Property 4: Room Configuration Persistence** - Test that max player count is preserved
    - **Property 6: Initial Room Phase** - Test that new rooms start in LOBBY phase
    - **Property 7: Successful Join Increases Player Count** - Test that joining increases count by one
    - **Property 9: Player ID Uniqueness Within Room** - Test that all player IDs in a room are unique
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 3.1, 3.6**
  
  - [x]* 2.3 Write unit tests for Room Manager edge cases
    - Test room deletion when empty
    - Test host transfer when host leaves
    - Test joining full room rejection
    - Test joining non-existent room
    - _Requirements: 3.2, 3.3, 8.4, 8.5_

- [x] 3. Implement Game State Manager
  - [x] 3.1 Create GameStateManager class
    - Implement startGame method using existing deck and dealing logic
    - Implement processCardPlay method that routes to Phase 1 or Phase 2 logic
    - Implement move validation using existing game logic
    - Return structured results with success/error and updated state
    - _Requirements: 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 3.2 Write property tests for Game State Manager
    - **Property 12: Game Start Minimum Players** - Test that games with sufficient players can start
    - **Property 13: Game Start Phase Transition** - Test that starting game transitions to DEALING
    - **Property 14: Turn Validation** - Test that out-of-turn plays are rejected
    - **Property 15: Valid Move State Update** - Test that valid moves update state correctly
    - **Property 16: Move Validation Against Game Rules** - Test that invalid cards are rejected
    - **Validates: Requirements 5.3, 5.4, 6.2, 6.4, 11.1, 11.4**
  
  - [x]* 3.3 Write unit tests for Game State Manager
    - Test Phase 1 card play processing
    - Test Phase 2 card play processing
    - Test phase transition from BERIZ to JHABBU
    - Test game over detection
    - _Requirements: 6.3, 14.1, 14.2, 14.3_

- [x] 4. Checkpoint - Ensure core backend logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Socket.io event handlers
  - [x] 5.1 Create socket handler setup function
    - Implement 'createRoom' event handler
    - Implement 'joinRoom' event handler with reconnection support
    - Implement 'startGame' event handler with host verification
    - Implement 'playCard' event handler with validation
    - Implement 'addBot' event handler
    - Add proper error handling and callbacks for all events
    - _Requirements: 2.1, 2.5, 3.1, 3.2, 3.3, 5.1, 5.2, 5.6, 6.1, 6.2, 6.4, 6.5, 13.1_
  
  - [ ]* 5.2 Write property tests for socket handlers
    - **Property 5: Room Creation Returns ID** - Test that createRoom returns valid room ID
    - **Property 8: Full Room Join Rejection** - Test that joining full room returns error
    - **Property 10: Invalid Move Rejection** - Test that invalid moves are rejected with error
    - **Property 11: Host Authorization for Game Start** - Test that only host can start game
    - **Property 22: Message Format Validation** - Test that messages with missing fields are rejected
    - **Property 23: Request Acknowledgment** - Test that all requests get responses
    - **Property 24: Validation Error Messages** - Test that errors include descriptive messages
    - **Property 25: Player Identity Verification** - Test that invalid player IDs are rejected
    - **Validates: Requirements 2.5, 3.2, 4.5, 4.6, 5.2, 5.6, 6.5, 10.3, 10.4, 10.6, 10.7, 11.2**
  
  - [x]* 5.3 Write unit tests for socket event handlers
    - Test successful room creation flow
    - Test successful player join flow
    - Test reconnection with valid session ID
    - Test game start by host
    - Test card play validation and broadcasting
    - _Requirements: 2.1, 3.1, 7.3, 5.1, 6.1_

- [x] 6. Implement session management and reconnection
  - [x] 6.1 Add session ID generation and storage
    - Generate unique session IDs on player join
    - Store session-to-player mapping in Room
    - Implement session validation on reconnection
    - Handle invalid/expired session rejection
    - _Requirements: 15.1, 15.4, 15.5_
  
  - [ ]* 6.2 Write property tests for session management
    - **Property 29: Session ID Uniqueness** - Test that all session IDs are unique
    - **Property 30: Session Validation** - Test that valid sessions are accepted on reconnect
    - **Property 31: Invalid Session Rejection** - Test that invalid sessions are rejected
    - **Validates: Requirements 15.1, 15.4, 15.5**
  
  - [-]* 6.3 Write unit tests for reconnection scenarios
    - Test reconnection with valid session restores player state
    - Test reconnection returns current game state
    - Test invalid session returns error
    - _Requirements: 7.3, 7.4, 15.4, 15.5_

- [x] 7. Implement disconnect handling
  - [x] 7.1 Add disconnect event handling
    - Mark player as disconnected on disconnect event
    - Implement game pause if current player disconnects
    - Broadcast disconnection to other players
    - Implement timeout for removing disconnected players
    - _Requirements: 7.1, 7.2, 7.5, 7.6_
  
  - [ ]* 7.2 Write property tests for disconnect handling
    - **Property 17: Disconnect Preserves Player** - Test that disconnect doesn't remove player
    - **Property 18: Reconnection Restores State** - Test disconnect then reconnect round-trip
    - **Property 19: Current Player Disconnect Pauses Game** - Test that game pauses on current player disconnect
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.6**

- [x] 8. Implement room cleanup and lifecycle management
  - [x] 8.1 Add room cleanup task
    - Implement periodic cleanup check (every 5 minutes)
    - Delete rooms inactive for 30 minutes
    - Delete empty rooms after 1 minute
    - Implement host transfer when host leaves
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 8.2 Write property tests for room lifecycle
    - **Property 20: Room Deletion Cleanup** - Test that deleted rooms are not retrievable
    - **Property 21: Host Transfer on Leave** - Test that host leaving promotes another player
    - **Validates: Requirements 8.3, 8.4**
  
  - [ ]* 8.3 Write unit tests for cleanup scenarios
    - Test empty room deletion
    - Test inactive room deletion
    - Test host transfer to next player
    - Test room deletion when last player leaves
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 9. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement frontend Socket Manager service
  - [x] 10.1 Create SocketManager class
    - Implement connection/disconnection methods
    - Implement room operation methods (create, join, start)
    - Implement game action methods (playCard, addBot)
    - Implement event listener registration methods
    - Add reconnection logic with exponential backoff
    - _Requirements: 9.1, 9.2, 9.7_
  
  - [ ]* 10.2 Write unit tests for Socket Manager
    - Test connection establishment
    - Test reconnection attempts
    - Test event emission with proper payloads
    - Test event listener registration
    - _Requirements: 9.1, 9.2, 9.7_

- [ ] 11. Integrate Socket Manager into React App
  - [x] 11.1 Modify App.tsx to use Socket Manager
    - Initialize SocketManager on component mount
    - Replace local state updates with socket event emissions
    - Add event listeners for server state updates
    - Update handleCreateRoom to use socketManager.createRoom
    - Update handleJoinRoom to use socketManager.joinRoom
    - Update handleStartGame to use socketManager.startGame
    - Update handlePlayCard to use socketManager.playCard
    - Store session ID in localStorage for reconnection
    - _Requirements: 4.1, 4.2, 4.4, 15.2, 15.3_
  
  - [ ]* 11.2 Write integration tests for App with Socket Manager
    - Test room creation flow
    - Test player join flow
    - Test game start flow
    - Test card play flow
    - Test reconnection on page refresh
    - _Requirements: 4.1, 4.2, 15.2, 15.3_

- [ ] 12. Implement bot support in online mode
  - [x] 12.1 Add bot execution on server
    - Import existing bot AI logic to server
    - Implement bot turn detection in game loop
    - Execute bot moves automatically with delay
    - Broadcast bot moves like human moves
    - _Requirements: 13.2, 13.3, 13.4_
  
  - [ ]* 12.2 Write property tests for bot behavior
    - **Property 27: Bot Addition Increases Player Count** - Test that adding bot increases count
    - **Property 28: Bot Turn Automation** - Test that bots play automatically on their turn
    - **Validates: Requirements 13.1, 13.3**
  
  - [ ]* 12.3 Write unit tests for bot integration
    - Test bot player creation
    - Test bot move execution
    - Test bot move broadcasting
    - _Requirements: 13.1, 13.2, 13.4_

- [ ] 13. Implement security and anti-cheating measures
  - [x] 13.1 Add server-side validation and security
    - Validate all moves against current game state
    - Filter player hands when sending state to clients
    - Implement rate limiting for requests
    - Add request logging for security monitoring
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ]* 13.2 Write property tests for security
    - **Property 26: Hand Privacy** - Test that players only receive their own hand
    - **Validates: Requirements 11.3**
  
  - [ ]* 13.3 Write unit tests for security measures
    - Test that players cannot see other hands
    - Test that players cannot play cards not in their hand
    - Test that invalid player IDs are rejected
    - Test that moves are validated against game state
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 14. Implement spectator mode
  - [x] 14.1 Add spectator support
    - Detect mid-game joins and create spectators
    - Send full game state to spectators
    - Broadcast updates to spectators
    - Prevent spectators from making moves
    - Allow spectators to join next round as players
    - _Requirements: 16.1, 16.2, 16.3, 16.5, 16.6_
  
  - [ ]* 14.2 Write property tests for spectator mode
    - **Property 32: Mid-Game Join Creates Spectator** - Test that joining during game creates spectator
    - **Property 33: Spectator Receives Game State** - Test that spectators receive current state
    - **Property 34: Spectator Move Rejection** - Test that spectator moves are rejected
    - **Property 35: Spectator to Player Transition** - Test that spectators can become players
    - **Validates: Requirements 16.1, 16.2, 16.5, 16.6**
  
  - [ ]* 14.3 Write unit tests for spectator scenarios
    - Test spectator creation on mid-game join
    - Test spectator receives game state
    - Test spectator cannot make moves
    - Test spectator promotion to player
    - _Requirements: 16.1, 16.2, 16.5, 16.6_

- [ ] 15. Implement error handling and user feedback
  - [x] 15.1 Add comprehensive error handling
    - Add error boundaries in React components
    - Display user-friendly error messages for network errors
    - Show reconnecting indicator during connection loss
    - Display success message on reconnection
    - Add loading states for all async operations
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ]* 15.2 Write unit tests for error handling
    - Test error message display for various error types
    - Test reconnecting indicator display
    - Test loading state management
    - _Requirements: 12.1, 12.2, 12.3, 12.6_

- [ ] 16. Implement room isolation testing
  - [ ]* 16.1 Write property tests for room isolation
    - **Property 1: Room Isolation** - Test that actions in one room don't affect other rooms
    - **Validates: Requirements 1.4**

- [ ] 17. Add environment configuration
  - [x] 17.1 Setup environment variables
    - Add `.env` files for development (frontend and backend)
    - Configure CORS with CLIENT_URL environment variable
    - Configure server port from environment
    - Add environment variable for WebSocket URL in frontend
    - Document all environment variables in README
    - _Requirements: 1.5_

- [ ] 18. Final checkpoint - End-to-end testing
  - [ ] 18.1 Test complete game flows
    - Test full game from room creation to game over
    - Test multiple concurrent games
    - Test reconnection during active game
    - Test bot vs human gameplay
    - Test spectator mode throughout game
    - _Requirements: All_
  
  - [ ]* 18.2 Write integration tests for complete flows
    - Test room creation → join → start → play → game over flow
    - Test disconnect → reconnect flow during game
    - Test multiple concurrent rooms
    - _Requirements: All_

- [ ] 19. Prepare for deployment
  - [x] 19.1 Setup deployment configuration
    - Create separate build scripts for frontend and backend
    - Add production environment configurations
    - Create deployment documentation
    - Setup health check endpoint
    - Add logging for production monitoring
    - _Requirements: 1.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The existing game logic is reused without modification, only wrapped in server-side validation
- Frontend changes are minimal - mainly replacing local state management with socket events
