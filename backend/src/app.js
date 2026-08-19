/**
 * Express Application Assembly
 * Task: BE-006 (Initialize Node.js/Express Backend)
 */

import express from 'express'
import cors from 'cors'
import apiRoutes from './routes/index.routes.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'

const app = express()

// Global Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mount Central API Router under /api
app.use('/api', apiRoutes)

// Handle 404 & Global Errors
app.use(notFoundHandler)
app.use(errorHandler)

export default app
