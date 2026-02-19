import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { RoomManager } from './managers/RoomManager';
import { setupSocketHandlers } from './handlers/socketHandlers';

const app = express();
const httpServer = createServer(app);

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Allowed origins for CORS
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:3000', // Local development
  'https://beriz-jhabbu.vercel.app', // Production frontend
  'https://www.beriz-jhabbu.vercel.app' // Production frontend with www
].filter(Boolean); // Remove any undefined values

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
  allowedOrigins: allowedOrigins
});

// Configure CORS with origin validation
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log.warn('CORS blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request body size limits to prevent DoS attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...allowedOrigins],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Socket.io
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow cross-origin requests
}));

log.info('Security headers configured with helmet');

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

// Initialize Socket.io with CORS validation
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        log.warn('Socket.io CORS blocked request from unauthorized origin', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
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
  
  // Sanitize error messages for production
  const clientError = NODE_ENV === 'production' 
    ? 'An error occurred. Please try again later.' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: clientError
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
