/**
 * Session & Bearer JWT Token Validation Middleware
 * Task: BE-029 (Implement Session/Token Validation)
 * SRS Traceability: FR-03 (Session Management), Section 13 (Security Requirements)
 */

import { verifyAuthToken } from '../modules/auth/auth.service.js'
import { UnauthorizedError } from '../utils/errors.js'

/**
 * Authenticate incoming requests by inspecting Bearer JWT token
 * @param {Object} req - Express Request
 * @param {Object} res - Express Response
 * @param {Function} next - Express Next Function
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required')
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      throw new UnauthorizedError('Authentication token required')
    }

    // Verify token signature and expiration
    const decodedPayload = verifyAuthToken(token)

    // Attach validated identity context to request object
    req.user = decodedPayload

    next()
  } catch (err) {
    next(err)
  }
}
