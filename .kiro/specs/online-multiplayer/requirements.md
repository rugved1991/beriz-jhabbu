# Requirements Document: Online Multiplayer for Beriz Jhabbu

## Introduction

This document specifies the requirements for transforming Beriz Jhabbu from a local multiplayer card game (all players on the same device) into a true online multiplayer experience where players can join from different devices and browsers. The system will enable real-time game state synchronization, room management, and graceful handling of network issues while maintaining the existing game logic and user experience.

## Glossary

- **Client**: The React-based frontend application running in a user's browser
- **Server**: The Node.js backend application that manages rooms and synchronizes game state
- **Room**: A game session that players can join using a unique room ID
- **Host**: The player who creates a room and has privileges to start the game
- **Player**: A user participating in a game room
- **Game_State**: The complete state of the game including players, cards, phase, and current turn
- **WebSocket**: A bidirectional communication protocol for real-time data exchange
- **Session**: A persistent connection between a client and server identified by a session ID
- **Reconnection**: The process of re-establishing a connection after a disconnect
- **Synchronization**: The process of ensuring all clients have the same game state

## Requirements

### Requirement 1: Backend Server Infrastructure

**User Story:** As a system architect, I want a robust backend server infrastructure, so that the game can support multiple concurrent rooms and real-time communication.

#### Acceptance Criteria

1. THE Server SHALL run on Node.js with Express framework
2. THE Server SHALL use Socket.io for WebSocket communication
3. THE Server SHALL maintain an in-memory store of active rooms and their game states
4. THE Server SHALL support multiple concurrent game rooms without interference
5. WHEN the server starts, THE Server SHALL listen on a configurable port
6. THE Server SHALL log all critical events for debugging and monitoring

### Requirement 2: Room Creation and Management

**User Story:** As a player, I want to create a game room with a unique ID, so that I can invite friends to join my game.

#### Acceptance Criteria

1. WHEN a user requests room creation, THE Server SHALL generate a unique 6-character alphanumeric room ID
2. THE Server SHALL ensure room IDs are unique across all active rooms
3. WHEN a room is created, THE Server SHALL initialize it with the creator as the host
4. THE Server SHALL store the room configuration including maximum player count
5. WHEN a room is created, THE Server SHALL return the room ID to the client
6. THE Server SHALL set the room status to LOBBY upon creation

### Requirement 3: Player Joining and Lobby

**User Story:** As a player, I want to join a room using a room ID, so that I can play with my friends.

#### Acceptance Criteria

1. WHEN a player attempts to join with a valid room ID, THE Server SHALL add them to the room if space is available
2. WHEN a player attempts to join a full room, THE Server SHALL reject the join request with an error message
3. WHEN a player attempts to join a non-existent room, THE Server SHALL return an error message
4. WHEN a player joins a room, THE Server SHALL broadcast the updated player list to all clients in that room
5. WHEN a player joins, THE Client SHALL display the updated lobby with all current players
6. THE Server SHALL assign each player a unique player ID within the room

### Requirement 4: Real-Time Game State Synchronization

**User Story:** As a player, I want to see game updates in real-time, so that I know what other players are doing.

#### Acceptance Criteria

1. WHEN any game state changes, THE Server SHALL broadcast the updated state to all connected clients in the room
2. WHEN a client receives a state update, THE Client SHALL update its local game state immediately
3. THE Server SHALL be the single source of truth for all game state
4. WHEN a player makes a move, THE Client SHALL send the move to the server for validation
5. THE Server SHALL validate all moves before applying them to the game state
6. WHEN a move is invalid, THE Server SHALL reject it and notify the client with an error message

### Requirement 5: Game Start Control

**User Story:** As a room host, I want to start the game when all players are ready, so that we can begin playing.

#### Acceptance Criteria

1. WHEN the host clicks start game, THE Client SHALL send a start game request to the server
2. THE Server SHALL verify the requester is the room host before starting the game
3. WHEN minimum player count is met, THE Server SHALL allow the game to start
4. WHEN the game starts, THE Server SHALL deal cards and transition to the DEALING phase
5. THE Server SHALL broadcast the game start event to all clients in the room
6. WHEN a non-host attempts to start the game, THE Server SHALL reject the request

### Requirement 6: Player Move Validation and Processing

**User Story:** As a player, I want my card plays to be validated by the server, so that the game rules are enforced fairly.

#### Acceptance Criteria

1. WHEN a player plays a card, THE Client SHALL send the card play to the server with player ID and card data
2. THE Server SHALL verify it is the player's turn before processing the move
3. THE Server SHALL validate the card play against game rules using existing game logic
4. WHEN a card play is valid, THE Server SHALL update the game state and broadcast to all clients
5. WHEN a card play is invalid, THE Server SHALL send an error message to the requesting client only
6. THE Server SHALL prevent clients from modifying game state directly

### Requirement 7: Player Disconnection Handling

**User Story:** As a player, I want to reconnect to my game if I lose connection, so that I don't lose my progress.

#### Acceptance Criteria

1. WHEN a player disconnects, THE Server SHALL mark the player as disconnected but keep them in the room
2. THE Server SHALL broadcast the disconnection event to other players in the room
3. WHEN a disconnected player reconnects with the same session ID, THE Server SHALL restore their player state
4. THE Server SHALL send the current game state to the reconnected player
5. WHEN a player is disconnected for more than 5 minutes, THE Server SHALL remove them from the room
6. THE Server SHALL pause the game if the current turn player disconnects

### Requirement 8: Room Cleanup and Lifecycle

**User Story:** As a system administrator, I want inactive rooms to be cleaned up automatically, so that server resources are not wasted.

#### Acceptance Criteria

1. WHEN all players leave a room, THE Server SHALL delete the room after 1 minute
2. WHEN a room has been inactive for 30 minutes, THE Server SHALL delete the room
3. THE Server SHALL remove all game state data when a room is deleted
4. WHEN the host leaves a room, THE Server SHALL transfer host privileges to another player
5. WHEN the host leaves and no other players remain, THE Server SHALL delete the room immediately

### Requirement 9: WebSocket-Based Real-Time Architecture

**User Story:** As a developer, I want to use WebSocket technology for game communication, so that players experience real-time gameplay with minimal latency.

#### Acceptance Criteria

1. THE System SHALL establish persistent WebSocket connections between clients and server
2. THE Client SHALL emit Socket.io events for all player actions (join room, play card, start game)
3. THE Server SHALL listen for Socket.io events and process them in real-time
4. THE Server SHALL broadcast game state updates to all clients in a room using Socket.io room broadcasting
5. THE System SHALL NOT use REST APIs for gameplay actions
6. THE System SHALL maintain the WebSocket connection throughout the entire game session
7. WHEN a WebSocket connection drops, THE Client SHALL attempt to reconnect automatically

### Requirement 10: Client-Server Communication Protocol

**User Story:** As a developer, I want a clear communication protocol between client and server, so that the system is maintainable and extensible.

#### Acceptance Criteria

1. THE System SHALL use WebSocket connections via Socket.io for all real-time game communication
2. THE System SHALL use Socket.io events (not REST APIs) for player actions including card plays, room joins, and game starts
3. WHEN sending events, THE Client SHALL include room ID and player ID in all game-related messages
4. THE Server SHALL acknowledge all client requests with success or error responses via Socket.io events
5. THE System SHALL use typed message formats for all events
6. THE Server SHALL validate all incoming messages for required fields and data types
7. WHEN validation fails, THE Server SHALL send a descriptive error message to the client via Socket.io
8. THE Server SHALL broadcast state updates to all clients in a room using Socket.io room broadcasting

### Requirement 11: Security and Anti-Cheating

**User Story:** As a player, I want the game to be fair and secure, so that no one can cheat.

#### Acceptance Criteria

1. THE Server SHALL validate all player moves against the current game state
2. THE Server SHALL verify player identity for all game actions
3. THE Server SHALL prevent players from seeing other players' hands
4. THE Server SHALL validate that players can only play cards from their own hand
5. WHEN a client sends invalid data, THE Server SHALL reject the request and log the attempt
6. THE Server SHALL rate-limit requests to prevent spam or denial-of-service attacks

### Requirement 12: Error Handling and User Feedback

**User Story:** As a player, I want clear error messages when something goes wrong, so that I know what to do.

#### Acceptance Criteria

1. WHEN a network error occurs, THE Client SHALL display a user-friendly error message
2. WHEN connection is lost, THE Client SHALL show a reconnecting indicator
3. WHEN reconnection succeeds, THE Client SHALL display a success message
4. WHEN a room is full, THE Client SHALL display "Room is full" message
5. WHEN a room doesn't exist, THE Client SHALL display "Room not found" message
6. THE Client SHALL provide visual feedback for all loading states

### Requirement 13: Bot Player Support in Online Mode

**User Story:** As a player, I want to add bot players to my online game, so that I can play with fewer human players.

#### Acceptance Criteria

1. WHEN the host adds a bot in the lobby, THE Server SHALL create a bot player in the room
2. THE Server SHALL execute bot moves using the existing bot AI logic
3. WHEN it's a bot's turn, THE Server SHALL automatically play the bot's move after a delay
4. THE Server SHALL broadcast bot moves to all clients like human player moves
5. THE Client SHALL display bot players with a visual indicator in the lobby and game

### Requirement 14: Existing Game Logic Preservation

**User Story:** As a developer, I want to preserve all existing game logic, so that the game rules remain unchanged.

#### Acceptance Criteria

1. THE Server SHALL use the existing Phase 1 (BERIZ) game logic without modification
2. THE Server SHALL use the existing Phase 2 (JHABBU) game logic without modification
3. THE Server SHALL maintain the existing game phases: SETUP, LOBBY, DEALING, BERIZ, JHABBU, GAME_OVER
4. THE Server SHALL use the existing card dealing and deck generation logic
5. THE Server SHALL preserve the existing player elimination and winner determination logic
6. THE Client SHALL maintain the existing UI components and user experience

### Requirement 15: Session Management and Authentication

**User Story:** As a player, I want my session to persist across page refreshes, so that I don't lose my game.

#### Acceptance Criteria

1. WHEN a player joins a room, THE Server SHALL generate a unique session ID
2. THE Client SHALL store the session ID in browser local storage
3. WHEN a page refreshes, THE Client SHALL attempt to reconnect using the stored session ID
4. THE Server SHALL validate session IDs and restore player state on reconnection
5. WHEN a session ID is invalid or expired, THE Server SHALL reject the reconnection
6. THE Client SHALL clear the session ID when the player explicitly leaves the room

### Requirement 16: Spectator Mode

**User Story:** As a user, I want to watch an ongoing game without participating, so that I can observe before joining the next round.

#### Acceptance Criteria

1. WHEN a player joins a room with a game in progress, THE Server SHALL add them as a spectator
2. THE Server SHALL send the current game state to spectators
3. THE Server SHALL broadcast game updates to spectators in real-time
4. THE Client SHALL display spectators separately from active players
5. THE Server SHALL prevent spectators from making game moves
6. WHEN the game ends, THE Server SHALL allow spectators to join the next round as players

