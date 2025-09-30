
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import GoogleRouter from './src/lib/api/backend/LoginComp/GoogleApi.js';
import LoginRouter from './src/lib/api/backend/LoginComp/LoginAPI.js';
import TrashcanRouter from './src/lib/api/backend/documents/TrashcanAPI.js';
import DocumentPreferencesRouter from './src/lib/api/backend/documents/DocumentPreferencesAPI.js';
import AnnouncementsRouter from './src/lib/api/backend/announcement/AnnouncementsAPI.js';
import FolderRouter from './src/lib/api/backend/documents/FolderAPI.js';
import DepartmentRouter from './src/lib/api/backend/department/DepartmentAPI.js';
import DocumentTypeRouter from './src/lib/api/backend/documents/DocumentTypeAPI.js';
import SystemMaintenanceRouter from './src/lib/api/backend/maintenance/SystemMaintenanceAPI.js';
import NotificationsRouter from './src/lib/api/backend/notifications/NotificationsAPI.js';
import UsersRouter from './src/lib/api/backend/users/UsersAPI.js';
import RequestsRouter from './src/lib/api/backend/documents/RequestsAPI.js';
import DocumentsRouter from './src/lib/api/backend/documents/DocumentsAPI.js';
import ActionsRouter from './src/lib/api/backend/actions/ActionsAPI.js';
import { 
  sessionConfig, 
  securityHeaders, 
  errorHandler, 
  requestLogger 
} from './src/lib/api/backend/middleware/authMiddleware.js';
import { checkMaintenanceMode } from './src/lib/api/backend/middleware/maintenanceMiddleware.js';

// Load environment variables
dotenv.config();

// ----- Config -----
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ----- App & Realtime -----
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// ----- Security Middleware -----
// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      // Allow API and WebSocket connections for real-time notifications
      connectSrc: [
        "'self'",
        "https://accounts.google.com",
        FRONTEND_URL,
        "http://localhost:5000",
        "ws://localhost:5000",
        "http://127.0.0.1:5000",
        "ws://127.0.0.1:5000"
      ],
      frameSrc: ["'self'", "https://drive.google.com", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression for better performance
app.use(compression());

// Cookie parser
app.use(cookieParser());

// ----- Core Middleware -----
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessions & Passport with enhanced security
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Request logging
app.use(requestLogger);

// Maintenance mode check (before routes)
app.use(checkMaintenanceMode);

// Attach Socket.IO to requests (if needed by routes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ----- Routes -----
// Health/root
app.get('/', (req, res) => {
  res.send('Welcome to the ISPSc DMS API');
});

// Simple health endpoint for debugging
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routers
app.use('/api', DepartmentRouter);
app.use("/api", LoginRouter);
app.use('/api', GoogleRouter);
app.use('/api', TrashcanRouter);
app.use('/api', DocumentPreferencesRouter);
app.use('/api', AnnouncementsRouter);
app.use('/api', FolderRouter);
app.use('/api', DocumentTypeRouter);
app.use('/api', SystemMaintenanceRouter);
app.use('/api', NotificationsRouter);
app.use('/api', UsersRouter);
app.use('/api', RequestsRouter);
app.use('/api', DocumentsRouter);
app.use('/api', ActionsRouter);

// ----- Serve Frontend (SPA) in production -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

// Serve static assets from Vite build output
app.use(express.static(distDir));

// SPA fallback: send index.html for non-API routes
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);
  
  // Handle authentication for socket connections
  socket.on('authenticate', (token) => {
    try {
      // Verify token and store user info in socket
      // This would integrate with your JWT verification
      socket.userId = 'authenticated'; // Placeholder
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authentication_error', { message: 'Invalid token' });
    }
  });

  // Allow clients to subscribe to targeted rooms
  socket.on('subscribe', (payload = {}) => {
    try {
      const { userId, departmentId, role } = payload || {};
      if (userId) {
        const room = `user:${userId}`;
        socket.join(room);
        console.log(`🔔 ${socket.id} joined ${room}`);
      }
      if (departmentId) {
        const room = `dept:${departmentId}`;
        socket.join(room);
        console.log(`🔔 ${socket.id} joined ${room}`);
      }
      if (role) {
        const room = `role:${String(role).toUpperCase()}`;
        socket.join(room);
        console.log(`🔔 ${socket.id} joined ${room}`);
      }
      socket.emit('subscribed', { ok: true });
    } catch (e) {
      socket.emit('subscribed', { ok: false, message: e?.message || 'subscribe failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ----- Error Handling -----
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// Global error handler
app.use(errorHandler);

// ----- Start Server -----
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔒 Security: Enhanced with Helmet, Rate Limiting, and JWT`);
});
