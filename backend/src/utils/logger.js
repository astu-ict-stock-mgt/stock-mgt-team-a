/**
 * Structured Logging Module (Pino)
 * Task: BE-017 (Implement Logging Infrastructure)
 * SRS Traceability: Section 12.3 (Audit), Section 13 (Security), NFR-11
 */

import pino from 'pino'
import { env } from '../config/env.js'

const isDev = env.NODE_ENV === 'development'

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  // Sensitive field redaction rules (SRS §13 Security Requirements)
  redact: {
    paths: [
      'password',
      'oldPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'authorization',
      'headers.authorization',
      'req.headers.authorization',
      'creditCard',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})
