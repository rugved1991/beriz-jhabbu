# Beriz Jhabbu Server

Backend server for Beriz Jhabbu online multiplayer game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the server:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Development

For development with auto-rebuild:
```bash
npm run watch
```

Then in another terminal:
```bash
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Endpoints

- `GET /health` - Health check endpoint

## WebSocket Events

The server uses Socket.io for real-time communication. Events will be documented as they are implemented.
