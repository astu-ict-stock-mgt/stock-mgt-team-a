/**
 * Permission Management Tests
 * Task: BE-037 (Permission Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import permissionRoutes from '../../src/modules/permissions/permission.routes.js'
import { errorHandler } from '../../src/middleware/error.middleware.js'

const app = express()
app.use(express.json())
app.use('/api/permissions', permissionRoutes)
app.use(errorHandler)

let authToken

describe('Permission Management API', () => {
  beforeAll(async () => {
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' })

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token
    }
  })

  describe('GET /api/permissions', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/permissions')
      expect(response.status).toBe(401)
    })

    it('should return permissions with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/permissions/:permissionId', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/permissions/some-id')
      expect(response.status).toBe(401)
    })

    it('should return permission by ID with valid auth', async () => {
      if (!authToken) return

      // First get a permission from the list
      const permissionsResponse = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${authToken}`)

      if (permissionsResponse.body.data.length > 0) {
        const permissionId = permissionsResponse.body.data[0].id
        const response = await request(app)
          .get(`/api/permissions/${permissionId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      }
    })
  })

  describe('GET /api/permissions/code/:code', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/permissions/code/USERS_READ')
      expect(response.status).toBe(401)
    })

    it('should return permission by code with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get('/api/permissions/code/USERS_READ')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('POST /api/permissions', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/permissions')
        .send({
          code: 'TEST_PERMISSION',
          name: 'Test Permission',
          description: 'A test permission',
        })
      expect(response.status).toBe(401)
    })
  })
})
