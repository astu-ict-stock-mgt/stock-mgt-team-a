/**
 * Authentication Middleware Tests
 * Task: BE-031 (Implement Session/Token Validation)
 * SRS Traceability: FR-03 (Session Management), Section 13 (Security Requirements)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'
import { authenticate } from '../../src/middleware/auth.middleware.js'

describe('BE-031: Authentication Middleware', () => {
  const secret = process.env.JWT_SECRET || 'your_jwt_secret'

  it('should return 401 if no authorization header is provided', () => {
    const req = { headers: {} }
    let statusCode = null
    let responseData = null

    const res = {
      status(code) {
        statusCode = code
        return this
      },
      json(data) {
        responseData = data
      },
    }

    const next = (err) => {
      if (err) {
        statusCode = err.statusCode || 500
        responseData = { message: err.message }
      }
    }

    authenticate(req, res, next)
    expect(statusCode).toBe(401)
    expect(responseData.message).toBe('Authentication token required')
  })

  it('should call next() and set req.user if token is valid', () => {
    const payload = { userId: '123', role: 'ADMIN' }
    const token = jwt.sign(payload, secret)
    const req = { headers: { authorization: `Bearer ${token}` } }
    let nextCalled = false

    authenticate(req, {}, () => {
      nextCalled = true
    })

    expect(nextCalled).toBe(true)
    expect(req.user.userId).toBe('123')
  })

  it('should return 401 if token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } }
    let statusCode = null
    let responseData = null

    const res = {
      status(code) {
        statusCode = code
        return this
      },
      json(data) {
        responseData = data
      },
    }

    const next = (err) => {
      if (err) {
        statusCode = err.statusCode || 500
        responseData = { message: err.message }
      }
    }

    authenticate(req, res, next)
    expect(statusCode).toBe(401)
  })
})
