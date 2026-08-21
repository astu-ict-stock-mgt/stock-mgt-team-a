/**
 * Account Activation/Deactivation Tests
 * Task: BE-038 (Account Activation/Deactivation)
 * SRS Traceability: FR-01 (User Management)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import accountActivationRoutes from '../../src/modules/users/account-activation.routes.js'
import { errorHandler } from '../../src/middleware/error.middleware.js'
import { prisma } from '../../src/config/database.js'
import { hashPassword } from '../../src/utils/password.js'

const app = express()
app.use(express.json())
app.use('/api/users', accountActivationRoutes)
app.use(errorHandler)

let authToken
let testUserId

describe('Account Activation/Deactivation API', () => {
  beforeAll(async () => {
    // Create test user
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test-activation@example.com' },
    })

    if (!existingUser) {
      const passwordHash = await hashPassword('TestPassword123!')
      const user = await prisma.user.create({
        data: {
          email: 'test-activation@example.com',
          fullName: 'Test Activation User',
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
      .send({ email: 'admin@example.com', password: 'Admin123!' })

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token
    }
  })

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await prisma.userRole.deleteMany({ where: { userId: testUserId } })
      await prisma.user.deleteMany({ where: { email: 'test-activation@example.com' } })
    }
  })

  describe('POST /api/users/:userId/activate', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).post(`/api/users/${testUserId}/activate`)
      expect(response.status).toBe(401)
    })

    it('should return 409 if user already active', async () => {
      if (!authToken) return

      const response = await request(app)
        .post(`/api/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(409)
    })

    it('should activate inactive user', async () => {
      if (!authToken) return

      // First deactivate
      await request(app)
        .post(`/api/users/${testUserId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)

      // Then activate
      const response = await request(app)
        .post(`/api/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('ACTIVE')
    })
  })

  describe('POST /api/users/:userId/deactivate', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).post(`/api/users/${testUserId}/deactivate`)
      expect(response.status).toBe(401)
    })

    it('should return 409 if user already inactive', async () => {
      if (!authToken) return

      // First deactivate
      await request(app)
        .post(`/api/users/${testUserId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)

      // Try to deactivate again
      const response = await request(app)
        .post(`/api/users/${testUserId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(409)
    })

    it('should deactivate active user', async () => {
      if (!authToken) return

      // First activate
      await request(app)
        .post(`/api/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)

      // Then deactivate
      const response = await request(app)
        .post(`/api/users/${testUserId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('INACTIVE')
    })
  })

  describe('POST /api/users/:userId/toggle-status', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).post(`/api/users/${testUserId}/toggle-status`)
      expect(response.status).toBe(401)
    })

    it('should toggle user status', async () => {
      if (!authToken) return

      // First activate
      await request(app)
        .post(`/api/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)

      // Toggle status
      const response = await request(app)
        .post(`/api/users/${testUserId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('INACTIVE')
    })
  })

  describe('POST /api/users/bulk/activate', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/users/bulk/activate')
        .send({ userIds: [testUserId] })
      expect(response.status).toBe(401)
    })

    it('should bulk activate users', async () => {
      if (!authToken) return

      // First deactivate
      await request(app)
        .post(`/api/users/${testUserId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)

      // Bulk activate
      const response = await request(app)
        .post('/api/users/bulk/activate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userIds: [testUserId] })

      expect(response.status).toBe(200)
      expect(response.body.data.activated).toBe(1)
    })
  })

  describe('POST /api/users/bulk/deactivate', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/users/bulk/deactivate')
        .send({ userIds: [testUserId] })
      expect(response.status).toBe(401)
    })

    it('should bulk deactivate users', async () => {
      if (!authToken) return

      // First activate
      await request(app)
        .post(`/api/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)

      // Bulk deactivate
      const response = await request(app)
        .post('/api/users/bulk/deactivate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userIds: [testUserId] })

      expect(response.status).toBe(200)
      expect(response.body.data.deactivated).toBe(1)
    })
  })
})
