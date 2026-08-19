import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import { getCorsOptions, getHelmetOptions, apiRateLimiter } from './config/security.js'

const app = express()
const PORT = process.env.PORT || 3001

// 1. Security headers (helmet)
app.use(helmet(getHelmetOptions()))

// 2. CORS with allow-list
app.use(cors(getCorsOptions()))

// 3. Rate limiting (global)
app.use(apiRateLimiter)

// 4. Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Swagger UI served at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Stock Management API Docs'
}))

// OpenAPI spec as JSON
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns server status and timestamp
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
