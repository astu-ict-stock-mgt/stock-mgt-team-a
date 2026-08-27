/**
 * Centralized Error & 404 Middleware
 * Task: BE-006 & BE-015
 */

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  })
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500

  if (statusCode >= 500) {
    console.error('Unhandled Server Error (5xx):', err)
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${err.message}`)
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
      message: err.message || 'An unexpected error occurred',
      details: err.details || null,
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
    },
  })
}
