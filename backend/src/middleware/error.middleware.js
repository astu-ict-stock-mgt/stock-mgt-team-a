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
  console.error('Unhandled Server Error:', err)

  const statusCode = err.status || err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
}
