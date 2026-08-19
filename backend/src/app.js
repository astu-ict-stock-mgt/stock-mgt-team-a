/**
 * Express Application Bootstrap & Middleware Pipeline
 * Task: BE-013 (Build Application Bootstrap)
 * SRS Traceability: NFR-05 (Security), Section 13 (Security Requirements)
 * 
 * Middleware Execution Order:
 * 1. helmet()              - Security HTTP headers
 * 2. cors()                - CORS origin validation (bound to env.CORS_ORIGIN)
 * 3. express.json()        - JSON body parsing (10mb limit)
 * 4. express.urlencoded()  - URL-encoded body parsing (10mb limit)
 * 5. /api                  - Central API Router Aggregator
 * 6. notFoundHandler       - 404 Route Catch-all
 * 7. errorHandler          - Centralized Error Handler Middleware
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import apiRoutes from './routes/index.routes.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'

const app = express()

// 1. Security HTTP Headers (Helmet)
app.use(helmet())

// 2. CORS Origin Configuration
const corsOptions = {
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}
app.use(cors(corsOptions))

// 3. Body Parsing Middleware with Payload Limits
app.use(express.json({ limit: '10mb' }))

// 4. URL-Encoded Form Body Parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 5. Central API Routes
app.use('/api', apiRoutes)

// 6. 404 Catch-All Handler
app.use(notFoundHandler)

// 7. Global Error Handler
app.use(errorHandler)

export default app
