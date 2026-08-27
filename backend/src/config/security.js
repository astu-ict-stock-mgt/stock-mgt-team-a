import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

/**
 * CORS configuration
 * In production, CORS_ORIGINS must be a comma-separated list of allowed origins.
 * In development, localhost origins are allowed by default.
 */
export function getCorsOptions() {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      // In development, allow all origins (local network access)
      if (process.env.NODE_ENV === 'development') return callback(null, true)
      const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:5173', 'http://localhost:3000']
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 86400 // preflight cache 24h
  }
}

/**
 * Helmet configuration
 * Sets secure HTTP headers
 */
export function getHelmetOptions() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Swagger UI needs inline
        styleSrc: ["'self'", "'unsafe-inline'"],   // Swagger UI needs inline
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Swagger UI
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Swagger UI
  }
}

/**
 * Rate limiter for auth routes
 * Stricter limits to prevent brute-force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.'
    }
  },
  skip: (req) => {
    // Skip rate limiting in test/development environment
    return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
  }
})

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  },
  skip: (req) => {
    // Skip rate limiting for health checks and in test/development environment
    return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || req.path === '/api/health' || req.path === '/health'
  }
})

/**
 * Secure cookie configuration
 */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}
