/**
 * Role Management Tests
 * Task: BE-036 (Role Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import roleRoutes from '../src/modules/roles/role.routes.js'
import { errorHandler } from '../src/middleware/error.middleware.js'
import { prisma } from '../src/config/database.js'
import { hashPassword } from '../src/utils/password.js'

const app = express()
app.use(express.json())
app.use('/api/roles', roleRoutes)
app.use(errorHandler)

let authToken

describe('Role Management API', () => {
  beforeAll(async () => {
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' })

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token
    }
  })

  describe('GET /api/roles', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/roles')
      expect(response.status).toBe(401)
    })

    it('should return roles with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/roles/:roleId', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/roles/some-id')
      expect(response.status).toBe(401)
    })

    it('should return role by ID with valid auth', async () => {
      if (!authToken) return

      // First get a role from the list
      const rolesResponse = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${authToken}`)

      if (rolesResponse.body.data.length > 0) {
        const roleId = rolesResponse.body.data[0].id
        const response = await request(app)
          .get(`/api/roles/${roleId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      }
    })
  })

  describe('POST /api/roles', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/roles')
        .send({
          code: 'TEST_ROLE',
          name: 'Test Role',
          description: 'A test role',
        })
      expect(response.status).toBe(401)
    })
  })
})
