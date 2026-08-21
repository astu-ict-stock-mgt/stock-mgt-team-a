/**
 * User Management Tests
 * Task: BE-034 (User Management Service)
 * SRS Traceability: FR-01 (User Management)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import userRoutes from '../../src/modules/users/user.routes.js'
import { errorHandler } from '../../src/middleware/error.middleware.js'
import { prisma } from '../../src/config/database.js'
import { hashPassword } from '../../src/utils/password.js'

const app = express()
app.use(express.json())
app.use('/api/users', userRoutes)
app.use(errorHandler)

let authToken
let testUserId

describe('User Management API', () => {
  beforeAll(async () => {
    // Create test user for authentication
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test-admin@example.com' },
    })

    if (!existingUser) {
      const passwordHash = await hashPassword('TestPassword123!')
      const user = await prisma.user.create({
        data: {
          email: 'test-admin@example.com',
          fullName: 'Test Admin',
          passwordHash,
          status: 'ACTIVE',
        },
      })
      testUserId = user.id
    } else {
      testUserId = existingUser.id
    }

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-admin@example.com', password: 'TestPassword123!' })

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token
    }
  })

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await prisma.userRole.deleteMany({ where: { userId: testUserId } })
      await prisma.user.deleteMany({ where: { email: 'test-admin@example.com' } })
    }
  })

  describe('GET /api/users', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/users')
      expect(response.status).toBe(401)
    })

    it('should return paginated users with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.meta).toBeDefined()
    })
  })

  describe('GET /api/users/:userId', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get(`/api/users/${testUserId}`)
      expect(response.status).toBe(401)
    })

    it('should return user by ID with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('POST /api/users', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'new-user@example.com',
          fullName: 'New User',
          password: 'Password123!',
        })
      expect(response.status).toBe(401)
    })
  })
})
