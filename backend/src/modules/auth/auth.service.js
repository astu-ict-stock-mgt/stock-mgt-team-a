/**
 * Central Authentication & RBAC Service
 * Tasks: BE-002, BE-007, BE-027, BE-028, BE-030 (Implement Logout/Session Revocation)
 * SRS Traceability: Section 10.1, Section 13 (Security), FR-01, FR-03, Appendix C
 */

import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { prisma } from '../../config/database.js'
import { verifyPassword } from '../../utils/password.js'
import { UnauthorizedError } from '../../utils/errors.js'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX } from '../../config/rbac.js'

// In-Memory Token Blacklist / Revocation Cache (SRS FR-03)
const revokedTokenSet = new Set()

/**
 * Revoke an active session token
 * @param {string} token - JWT token string
 */
export const revokeToken = (token) => {
  if (token && typeof token === 'string') {
    revokedTokenSet.add(token)
  }
}

/**
 * Check if a token has been revoked
 * @param {string} token 
 * @returns {boolean}
 */
export const isTokenRevoked = (token) => {
  return revokedTokenSet.has(token)
}

// Legacy Metadata Functions (BE-002 / BE-007)
export const fetchRoles = () => Object.values(ROLES)
export const fetchPermissions = () => Object.values(PERMISSIONS)
export const fetchMatrix = () => ROLE_PERMISSIONS_MATRIX
export const fetchRoleDetails = (roleCode) => ROLES[roleCode.toUpperCase()] || null

/**
 * Generate a signed JWT Access Token
 * @param {Object} payload - User claims payload { userId, email, fullName, status }
 * @param {string} [expiresIn='8h'] - Token expiration duration
 * @returns {string} Signed JWT token string
 */
export const issueAuthToken = (payload, expiresIn = '8h') => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn })
}

/**
 * Verify and decode an incoming JWT Access Token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded token payload
 */
export const verifyAuthToken = (token) => {
  if (!token || isTokenRevoked(token)) {
    throw new UnauthorizedError('Session has been revoked or logged out')
  }

  try {
    return jwt.verify(token, env.JWT_SECRET)
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired authentication token')
  }
}

/**
 * Authenticate user credentials and return authenticated user payload + JWT token
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { user: { id, email, fullName, status }, token }
 */
export const authenticateUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new UnauthorizedError('Email and password are required')
  }

  let user = null
  try {
    user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
  } catch (_dbErr) {
    throw new UnauthorizedError('Invalid email or password')
  }

  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Invalid email or password')
  }

  const isMatch = await verifyPassword(password, user.passwordHash)
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password')
  }

  // Fetch user roles for JWT
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  })
  const roleCodes = userRoles.map(ur => ur.role.code)

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    roles: roleCodes,
  }

  const token = issueAuthToken(tokenPayload)

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      createdAt: user.createdAt,
    },
    token,
  }
}

/**
 * Log out user and revoke session token (BE-030)
 * @param {string} token - Bearer JWT token string
 * @returns {Object} Logout confirmation payload
 */
export const logoutUser = async (token) => {
  if (!token) {
    throw new UnauthorizedError('No active session token provided')
  }

  revokeToken(token)
  return { message: 'Successfully logged out and session revoked' }
}
