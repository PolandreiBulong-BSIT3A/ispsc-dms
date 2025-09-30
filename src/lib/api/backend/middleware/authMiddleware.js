import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Rate limiting configurations
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { 
    success: false, 
    message: 'Too many login attempts. Please try again in 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signup attempts per hour
  message: { 
    success: false, 
    message: 'Too many signup attempts. Please try again in 1 hour.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes
  message: { 
    success: false, 
    message: 'Too many OTP requests. Please try again in 5 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// JWT Token generation
export const generateTokens = (user) => {
  const payload = {
    id: user.user_id || user.id,
    email: user.user_email || user.email,
    role: user.role,
    department: user.department,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ispsc-dms',
    audience: 'ispsc-dms-users'
  });

  const refreshToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'ispsc-dms',
    audience: 'ispsc-dms-refresh'
  });

  return { accessToken, refreshToken };
};

// JWT Token verification
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Enhanced authentication middleware
export const requireAuth = (req, res, next) => {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      // Fallback to session-based auth for backward compatibility
      const passportUser = req.user;
      const sessionUser = req.session && req.session.user;
      const user = passportUser || sessionUser;
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required. Please log in.',
          code: 'AUTH_REQUIRED'
        });
      }

      req.currentUser = {
        id: user.user_id || user.id,
        email: user.user_email || user.email,
        username: user.Username || user.username,
        role: user.role,
        department: user.department,
        department_id: user.department_id,
      };
      return next();
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    req.currentUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token. Please log in again.',
      code: 'TOKEN_INVALID'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.currentUser) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    const userRole = req.currentUser.role?.toLowerCase();
    const requiredRoles = Array.isArray(roles) ? roles.map(r => r.toLowerCase()) : [roles.toLowerCase()];

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions for this action.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Admin authorization middleware
export const requireAdmin = requireRole(['admin', 'administrator']);

// Dean authorization middleware
export const requireDean = requireRole(['dean', 'admin', 'administrator']);

// Input validation middleware
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  body('firstname')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastname')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name is required and must be less than 50 characters'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('contactNumber')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid contact number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Enhanced password hashing with configurable salt rounds
export const hashPassword = async (password) => {
  const saltRounds = process.env.BCRYPT_SALT_ROUNDS || 12;
  return await bcrypt.hash(password, parseInt(saltRounds));
};

// Enhanced password comparison
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Session security configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // Use 'none' in production for cross-site cookies (frontend on different domain)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'ispsc-dms-session'
};

// Security headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://accounts.google.com;"
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};
