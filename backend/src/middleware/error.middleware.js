/**
 * Centralized Global Error & 404 Middleware
 * Tasks: BE-006 & BE-015 (Global Error Handling)
 * SRS Traceability: Section 13 (Security), NFR-04, NFR-05
 */

import { AppError } from '../utils/errors.js'

export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  })
}

export const errorHandler = (err, req, res, _next) => {
  // 1. Handle Custom Domain Errors (AppError hierarchy)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    })
  }

  // 2. Handle Prisma Database Exception Mapping
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    let statusCode = 400
    let code = 'DATABASE_ERROR'
    let message = 'A database error occurred'

    switch (err.code) {
      case 'P2002':
        statusCode = 409
        code = 'DUPLICATE_ENTRY'
        message = 'A record with that unique key already exists'
        break
      case 'P2025':
        statusCode = 404
        code = 'NOT_FOUND'
        message = 'Target record was not found in the database'
        break
      case 'P2003':
        statusCode = 400
        code = 'FOREIGN_KEY_CONSTRAINT_FAILED'
        message = 'Referenced entity does not exist'
        break
      default:
        statusCode = 500
        code = 'DATABASE_EXECUTION_ERROR'
        message = 'Database operation failed'
        break
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    })
  }

  // 3. Handle Unexpected Server Errors (Mask stack traces in production)
  console.error('🔥 Unhandled Server Error:', err)
  const isDev = (process.env.NODE_ENV || 'development') === 'development'

  res.status(err.status || err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message || 'Internal Server Error' : 'An unexpected server error occurred',
      ...(isDev && { stack: err.stack }),
    },
  })
}
