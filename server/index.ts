import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './managers/RoomManager';
import { setupSocketHandlers } from './handlers/socketHandlers';

const app = express();
const httpServer = createServer(app);

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Production logging utility
const log = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ level: 'info', timestamp, message, ...meta }));
  },
  error: (message: string, error?: any, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.error(JSON.stringify({ 
      level: 'error', 
      timestamp, 
      message, 
      error: error?.message || error,
      stack: error?.stack,
      ...meta 
    }));
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({ level: 'warn', timestamp, message, ...meta }));
  }
};

// Log startup configuration
log.info('Server starting', {
  nodeEnv: NODE_ENV,
  port: PORT,
  clientUrl: CLIENT_URL
});

// Configure CORS
app.use(cors({ origin: CLIENT_URL }));

// Enforce HTTPS in production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is already HTTPS
    const proto = req.header('x-forwarded-proto');
    if (proto && proto !== 'https') {
      log.warn('HTTP request redirected to HTTPS', {
        path: req.path,
        ip: req.ip
      });
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
  
  log.info('HTTPS enforcement enabled');
}

// Request logging middleware for production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      log.info('HTTP request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    });
    next();
  });
}

// Initialize Socket.io with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Initialize Room Manager
const roomManager = new RoomManager();
roomManager.startCleanupTask();

// Setup Socket.io event handlers
setupSocketHandlers(io, roomManager);

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    rooms: roomManager.getRoomCount(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: NODE_ENV
  };
  
  res.json(health);
  
  // Log health checks in production for monitoring
  if (NODE_ENV === 'production') {
    log.info('Health check', { rooms: health.rooms, uptime: health.uptime });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.error('Express error', err, {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Start server
httpServer.listen(PORT, () => {
  log.info('Server started successfully', {
    port: PORT,
    environment: NODE_ENV,
    clientUrl: CLIENT_URL
  });
  
  if (NODE_ENV === 'development') {
    console.log(`\n🎮 Beriz Jhabbu Server`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket server ready`);
    console.log(`🌐 Accepting connections from: ${CLIENT_URL}\n`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    log.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    log.info('Server closed');
    process.exit(0);
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection', reason, { promise: String(promise) });
});
