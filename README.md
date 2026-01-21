# Beriz Jhabbu Card Game

A React-based web card game featuring two distinct gameplay phases: Beriz (addition phase) and Jhabbu (shedding phase).

## Tech Stack

- **React 19** with **TypeScript**
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Jest** and **React Testing Library** for unit testing
- **fast-check** for property-based testing

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### Testing

```bash
npm test
```

Runs the test suite in interactive watch mode.

```bash
npm test -- --watchAll=false
```

Runs all tests once without watch mode.

### Build

```bash
npm build
```

Builds the app for production to the `build` folder.

## Project Structure

```
src/
├── types/          # TypeScript type definitions
│   └── index.ts    # Core interfaces (Card, Player, GameState, Room)
├── utils/          # Utility functions
│   └── roomUtils.ts # Room ID generation and validation
├── components/     # React components (to be added)
├── App.tsx         # Main application component
└── index.tsx       # Application entry point
```

## Core Types

- **Card**: Represents a playing card with suit, rank, and unique ID
- **Player**: Player state including hand, side deck, and position
- **GameState**: Complete game state including phase, players, and table
- **Room**: Room configuration and game state container

## Game Phases

1. **SETUP**: Initial room creation
2. **LOBBY**: Players join the room
3. **DEALING**: Cards are distributed to players
4. **BERIZ**: Phase 1 - Addition phase with penalty detection
5. **JHABBU**: Phase 2 - Trick-taking phase
6. **GAME_OVER**: Game completion

## Requirements

See `.kiro/specs/beriz-jhaboo-game/requirements.md` for detailed game requirements.

## Design

See `.kiro/specs/beriz-jhaboo-game/design.md` for architecture and design decisions.
