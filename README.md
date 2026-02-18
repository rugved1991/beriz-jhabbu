# Beriz Jhabbu - Online Multiplayer Card Game

A real-time online multiplayer implementation of the traditional Beriz Jhabbu card game, built with React and Node.js.

## Features

- 🎮 Real-time multiplayer gameplay using WebSockets
- 🏠 Room-based game sessions with unique room codes
- 🤖 Bot player support for single-player or mixed games
- 👥 2-8 player support per room
- 🔄 Automatic reconnection on network issues
- 👀 Spectator mode for ongoing games
- 📱 Responsive design for desktop and mobile

## Tech Stack

### Frontend
- React 19 with TypeScript
- Socket.io Client for WebSocket communication
- Framer Motion for animations
- Tailwind CSS for styling

### Backend
- Node.js with Express
- Socket.io for real-time communication
- TypeScript for type safety
- In-memory game state management

## Project Structure

```
beriz-jhabbu/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── services/          # Socket manager and services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Game logic utilities
├── server/                # Node.js backend
│   ├── managers/          # Room and game state managers
│   ├── handlers/          # Socket event handlers
│   └── index.ts           # Server entry point
├── public/                # Static assets
└── DEPLOYMENT.md          # Deployment guide
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd beriz-jhabbu
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
npm run server:install
```

4. Create environment files:

Frontend (`.env.local`):
```env
REACT_APP_SERVER_URL=http://localhost:3001
```

Backend (`server/.env`):
```env
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Running Locally

1. Start the backend server:
```bash
npm run server:dev
```

2. In a separate terminal, start the frontend:
```bash
npm start
```

3. Open http://localhost:3000 in your browser

## Available Scripts

### Frontend Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test -- --no-watch --watchAll=false` - Run tests
- `npm run deploy:frontend` - Build frontend for deployment

### Backend Scripts

- `npm run server:dev` - Start backend in development mode
- `npm run server:build` - Build backend for production
- `npm run server:start` - Start production backend
- `cd server && npm test -- --no-watch --watchAll=false` - Run backend tests

## Environment Variables

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_SERVER_URL` | Backend WebSocket server URL | `http://localhost:3001` |

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Summary

**Backend (Render)**:
1. Push code to GitHub
2. Create new Web Service on Render
3. Set root directory to `server`
4. Configure environment variables
5. Deploy

**Frontend (Vercel)**:
1. Import GitHub repository to Vercel
2. Configure environment variables
3. Deploy

## Game Rules

### Phase 1: BERIZ (Card Collection)
- Players take turns playing one card at a time
- Collect cards by matching ranks or playing specific combinations
- Build your side deck for Phase 2

### Phase 2: JHABBU (Trick-Taking)
- Play cards from your side deck
- Follow suit if possible
- Highest card of the lead suit wins the trick
- Announce "Jhabbu" when playing your last card
- Last player with cards remaining loses

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "rooms": 3,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345,
  "memory": {...},
  "environment": "production"
}
```

## WebSocket Events

### Client → Server

- `createRoom` - Create a new game room
- `joinRoom` - Join an existing room
- `startGame` - Start the game (host only)
- `playCard` - Play a card
- `addBot` - Add a bot player (host only)

### Server → Client

- `playerJoined` - Player joined the room
- `gameStarted` - Game has started
- `gameStateUpdated` - Game state changed
- `playerReconnected` - Player reconnected
- `playerDisconnected` - Player disconnected

## Testing

### Running Tests

Frontend tests:
```bash
npm test -- --no-watch --watchAll=false
```

Backend tests:
```bash
cd server
npm test -- --no-watch --watchAll=false
```

### Test Coverage

The project includes:
- Unit tests for game logic
- Property-based tests for correctness properties
- Integration tests for Socket.io communication
- End-to-end game flow tests

## Monitoring

### Health Check Monitoring

Monitor the backend health endpoint:
```bash
curl https://your-backend-url.onrender.com/health
```

### Logs

**Production Logs** (JSON format):
```json
{
  "level": "info",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Server started successfully",
  "port": 3001,
  "environment": "production"
}
```

**Development Logs** (Human-readable):
```
🎮 Beriz Jhabbu Server
📡 Server running on port 3001
🏥 Health check: http://localhost:3001/health
🔌 WebSocket server ready
```

## Troubleshooting

### Connection Issues

**Problem**: Frontend cannot connect to backend

**Solutions**:
1. Verify `REACT_APP_SERVER_URL` is set correctly
2. Check backend is running (visit `/health` endpoint)
3. Verify CORS configuration matches frontend URL
4. Check browser console for specific errors

### CORS Errors

**Problem**: "CORS policy" error in browser

**Solutions**:
1. Ensure `CLIENT_URL` matches frontend URL exactly
2. No trailing slashes in URLs
3. Redeploy backend after changing environment variables

### Cold Starts (Render Free Tier)

**Problem**: First request takes 30-60 seconds

**Explanation**: Render free tier spins down after inactivity

**Solutions**:
1. Upgrade to paid tier ($7/month)
2. Use uptime monitoring service to keep server active
3. Accept as limitation of free tier

## Performance

### Current Capacity

- **Concurrent rooms**: ~100
- **Players per room**: 2-8
- **Total concurrent players**: ~400-800
- **Memory usage**: ~512MB

### Optimization

- Automatic room cleanup (inactive > 30 minutes)
- Efficient in-memory storage with Map structures
- WebSocket connection pooling
- Minimal state synchronization

## Security

### Implemented Security Measures

- ✅ CORS protection
- ✅ Server-side move validation
- ✅ Rate limiting
- ✅ Session management
- ✅ Hand privacy (players only see their own cards)
- ✅ Input validation
- ✅ Security event logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Create an issue on GitHub
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review server logs for error details

## Roadmap

- [ ] User authentication and accounts
- [ ] Persistent room storage with database
- [ ] Player statistics and leaderboards
- [ ] Game replay functionality
- [ ] Mobile app (React Native)
- [ ] Tournament mode
- [ ] Custom game rules and variants

## Acknowledgments

Built with ❤️ using modern web technologies.
