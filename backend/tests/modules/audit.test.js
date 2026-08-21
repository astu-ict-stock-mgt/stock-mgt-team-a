/**
 * Authentication Audit Events Tests
 * Task: BE-039 (Authentication Audit Events)
 * SRS Traceability: Section 13 (Security Requirements)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import auditRoutes from '../src/modules/audit/audit.routes.js'
import { errorHandler } from '../src/middleware/error.middleware.js'

const app = express()
app.use(express.json())
app.use('/api/audit', auditRoutes)
app.use(errorHandler)

let authToken

describe('Authentication Audit Events API', () => {
  beforeAll(async () => {
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' })

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token
    }
  })

  describe('GET /api/audit', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/audit')
      expect(response.status).toBe(401)
    })

    it('should return audit events with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.meta).toBeDefined()
    })
  })

  describe('GET /api/audit/types', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/audit/types')
      expect(response.status).toBe(401)
    })

    it('should return event types with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get('/api/audit/types')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/audit/recent', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/audit/recent')
      expect(response.status).toBe(401)
    })

    it('should return recent audit events with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .get('/api/audit/recent')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /api/audit', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/audit')
        .send({
          eventType: 'LOGIN_SUCCESS',
          details: 'Test login',
        })
      expect(response.status).toBe(401)
    })

    it('should create audit event with valid auth', async () => {
      if (!authToken) return

      const response = await request(app)
        .post('/api/audit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'LOGIN_SUCCESS',
          details: 'Test login event',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })

    it('should return 400 for invalid event type', async () => {
      if (!authToken) return

      const response = await request(app)
        .post('/api/audit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'INVALID_TYPE',
          details: 'Test event',
        })

      expect(response.status).toBe(400)
    })
  })
})
