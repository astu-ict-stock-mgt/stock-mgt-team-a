import { expect } from 'chai'
import jwt from 'jsonwebtoken'
import { authenticateToken } from '../../src/middleware/auth.middleware.js'

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

    authenticateToken(req, res, () => {})
    expect(statusCode).to.equal(401)
    expect(responseData.message).to.equal('Access token missing or invalid')
  })

  it('should call next() and set req.user if token is valid', () => {
    const payload = { userId: '123', role: 'ADMIN' }
    const token = jwt.sign(payload, secret)
    const req = { headers: { authorization: `Bearer ${token}` } }
    let nextCalled = false

    authenticateToken(req, {}, () => {
      nextCalled = true
    })

    expect(nextCalled).to.be.true
    expect(req.user.userId).to.equal('123')
  })
})