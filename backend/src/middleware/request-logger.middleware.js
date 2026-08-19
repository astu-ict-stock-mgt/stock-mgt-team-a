/**
 * Request Logger & Correlation ID Middleware
 * Task: BE-017 (Implement Logging Infrastructure)
 * SRS Traceability: Section 12.3 (Audit Logs), NFR-11 (Auditability)
 */

import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger.js'

export const requestLoggerMiddleware = (req, res, next) => {
  // Generate or attach existing request correlation ID
  const requestId = req.headers['x-request-id'] || uuidv4()
  req.id = requestId
  res.setHeader('x-request-id', requestId)

  const startTime = Date.now()

  // Log on response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get('user-agent') || 'unknown',
    }

    if (res.statusCode >= 500) {
      logger.error(logData, `HTTP ${req.method} ${req.originalUrl} -> ${res.statusCode}`)
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `HTTP ${req.method} ${req.originalUrl} -> ${res.statusCode}`)
    } else {
      logger.info(logData, `HTTP ${req.method} ${req.originalUrl} -> ${res.statusCode}`)
    }
  })

  next()
}
