/**
 * Express Application Bootstrap & Middleware Pipeline
 * Tasks: BE-013 & BE-017 (Logging Infrastructure)
 * SRS Traceability: NFR-05 (Security), NFR-11 (Auditability), Section 12.3, Section 13
 * 
 * Middleware Execution Order:
 * 1. helmet()                   - Security HTTP headers
 * 2. cors()                     - CORS origin validation (bound to env.CORS_ORIGIN)
 * 3. express.json()             - JSON body parsing (10mb limit)
 * 4. express.urlencoded()       - URL-encoded body parsing (10mb limit)
 * 5. requestLoggerMiddleware    - Correlation ID & HTTP Request Logger
 * 6. /api                       - Central API Router Aggregator
 * 7. notFoundHandler            - 404 Route Catch-all
 * 8. errorHandler               - Centralized Error Handler Middleware
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import apiRoutes from './routes/index.routes.js'
import { requestLoggerMiddleware } from './middleware/request-logger.middleware.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'

const app = express()

// 1. Security HTTP Headers (Helmet)
app.use(helmet())

// 2. CORS Origin Configuration
const corsOptions = {
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
  exposedHeaders: ['x-request-id'],
  credentials: true,
}
app.use(cors(corsOptions))

// 3. Body Parsing Middleware with Payload Limits
app.use(express.json({ limit: '10mb' }))

// 4. URL-Encoded Form Body Parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 5. Correlation ID & Request Logger Middleware
app.use(requestLoggerMiddleware)

// 6. Central API Routes
app.use('/api', apiRoutes)

// 7. 404 Catch-All Handler
app.use(notFoundHandler)

// 8. Global Error Handler
app.use(errorHandler)

export default app
