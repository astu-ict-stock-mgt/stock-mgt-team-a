/**
 * Express Application Assembly
 * Task: BE-006, BE-008, BE-032
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import { getCorsOptions, getHelmetOptions, apiRateLimiter } from './config/security.js'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX, getPermissionsForRole } from './config/rbac.js'
import { authenticate } from './middleware/auth.middleware.js'
import { authorize } from './middleware/rbac.middleware.js'
import masterRouter from './routes/index.routes.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'

const app = express()

// 1. Security headers (helmet)
app.use(helmet(getHelmetOptions()))

// 2. CORS with allow-list
app.use(cors(getCorsOptions()))

// 3. Rate limiting (global)
if (process.env.NODE_ENV !== 'test') {
  app.use(apiRateLimiter)
}

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

// RBAC Metadata Endpoints (authenticated + authorized)
app.get('/api/rbac/roles', authenticate, authorize(PERMISSIONS.USERS_READ), (req, res) => {
  res.json({ success: true, data: ROLES })
})

app.get('/api/rbac/permissions', authenticate, authorize(PERMISSIONS.PERMISSIONS_READ), (req, res) => {
  res.json({ success: true, data: PERMISSIONS })
})

app.get('/api/rbac/matrix', authenticate, authorize(PERMISSIONS.USERS_MANAGE), (req, res) => {
  res.json({ success: true, data: ROLE_PERMISSIONS_MATRIX })
})

app.get('/api/rbac/roles/:roleCode', authenticate, authorize(PERMISSIONS.USERS_READ), (req, res) => {
  const roleCode = req.params.roleCode.toUpperCase()
  if (!ROLES[roleCode]) {
    return res.status(404).json({ success: false, error: 'Role not found' })
  }
  res.json({
    success: true,
    data: {
      role: ROLES[roleCode],
      permissions: getPermissionsForRole(roleCode)
    }
  })
})

// Mount Central API Router under /api
app.use('/api', masterRouter)

// Handle 404 & Global Errors
app.use(notFoundHandler)
app.use(errorHandler)

export default app
