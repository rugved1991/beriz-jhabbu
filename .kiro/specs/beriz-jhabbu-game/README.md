# Beriz Jhabbu Game - Specification Overview

## Project Summary

Beriz Jhabbu is a sophisticated React-based card game featuring two distinct phases of gameplay. Built with TypeScript, Tailwind CSS, and Framer Motion, it supports 2-16 players with intelligent bot AI and comprehensive game mechanics.

## Specification Documents

This specification suite provides comprehensive documentation for the Beriz Jhabbu project:

### 📋 [Requirements](./requirements.md)
**Complete functional and non-functional requirements**
- Game setup and room management
- Phase 1 (Beriz) and Phase 2 (Jhabbu) mechanics
- User interface requirements
- Bot AI specifications
- Performance and accessibility requirements

### 🏗️ [Design](./design.md)
**Technical architecture and design decisions**
- Component architecture and data flow
- Game logic design patterns
- State management strategy
- Animation and visual design
- Performance optimization approaches

### 🔧 [Implementation](./implementation.md)
**Current implementation status and development guide**
- Completed features overview
- File structure and code organization
- Implementation patterns and best practices
- Priority roadmap for future development
- Quality assurance guidelines

### 🧪 [Testing](./testing.md)
**Comprehensive testing strategy and coverage**
- Unit testing with Jest and React Testing Library
- Property-based testing with fast-check
- Component and integration testing
- Test utilities and mock generators
- Coverage goals and CI/CD integration

## Quick Start Guide

### Understanding the Game
1. **Phase 1 (Beriz)**: Players play cards to a center pile, avoiding penalties
2. **Phase 2 (Jhabbu)**: Players shed cards through trick-taking with strategic "Jhabbu Dumps"
3. **Objective**: Be the first to empty your hand in Phase 2

### Technical Stack
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Testing**: Jest + React Testing Library + fast-check
- **Build**: Create React App

### Key Features
- ✅ **Complete Game Implementation**: Both phases fully functional
- ✅ **Intelligent Bot AI**: Strategic computer players
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Accessibility**: WCAG compliant with screen reader support
- ✅ **Comprehensive Testing**: >75% test coverage
- ✅ **Visual Polish**: Smooth animations and effects

## Architecture Highlights

### State Management
```typescript
// Centralized game state with immutable updates
const [gameState, setGameState] = useState<GameState>({
  phase: 'SETUP',
  players: [],
  currentPlayerIndex: 0,
  // ... other state
});
```

### Game Logic Separation
```
App.tsx (Controller)
├── Phase1Logic (Beriz rules)
├── Phase2Logic (Jhabbu rules)
├── PenaltyEngine (Penalty detection)
├── TrickEngine (Trick resolution)
└── BotAI (Computer players)
```

### Component Hierarchy
```
App
├── GameSetup (Room creation)
├── Lobby (Player management)
├── Table (Game board)
├── PlayerHand (Card interaction)
├── GameOver (Results)
└── Modals (Rules, announcements)
```

## Development Status

### ✅ Production Ready
- Core game mechanics
- User interface
- Bot AI system
- Basic testing suite
- Responsive design

### 🔄 In Progress
- Expanded test coverage
- Performance optimization
- Mobile UX improvements
- Advanced bot strategies

### 🎯 Future Enhancements
- Multiplayer networking
- Tournament mode
- Game statistics
- Custom themes

## File References

The specification documents reference the following key implementation files:

### Core Game Logic
- `src/types/index.ts` - Type definitions
- `src/utils/stateMachine.ts` - Phase transitions
- `src/utils/phase1Logic.ts` - Beriz game rules
- `src/utils/phase2Logic.ts` - Jhabbu game rules
- `src/utils/penaltyEngine.ts` - Penalty detection
- `src/utils/botAI.ts` - Computer player logic

### User Interface
- `src/App.tsx` - Main game controller
- `src/components/Table.tsx` - Game board display
- `src/components/PlayerHand.tsx` - Card interaction
- `src/components/GameSetup.tsx` - Room creation
- `src/components/Lobby.tsx` - Player management

### Testing
- `src/**/*.test.ts` - Unit tests
- `src/App.test.tsx` - Component tests

## Usage Guidelines

### For Developers
1. **Start with Requirements**: Understand game rules and technical requirements
2. **Review Design**: Study architecture patterns and design decisions
3. **Check Implementation**: See current status and development priorities
4. **Run Tests**: Understand testing strategy and coverage

### For Project Managers
1. **Requirements**: Complete feature specification with acceptance criteria
2. **Implementation**: Current status and development roadmap
3. **Testing**: Quality assurance strategy and coverage metrics

### For QA Engineers
1. **Testing**: Comprehensive test strategy and scenarios
2. **Requirements**: Detailed acceptance criteria
3. **Implementation**: Edge cases and error handling

## Contributing

When working on this project:

1. **Follow the Architecture**: Maintain separation of concerns
2. **Update Tests**: Maintain >80% coverage for new code
3. **Document Changes**: Update relevant specification documents
4. **Test Thoroughly**: Run full test suite before committing

## Support

For questions about the specification or implementation:

1. **Game Rules**: See `GAME_RULES.md` and Requirements document
2. **Technical Issues**: Check Design and Implementation documents
3. **Testing**: Refer to Testing strategy document
4. **Code Examples**: Review existing implementation files

---

This specification suite provides everything needed to understand, develop, test, and maintain the Beriz Jhabbu card game project.