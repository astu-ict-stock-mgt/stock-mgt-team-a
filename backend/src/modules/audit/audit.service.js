/**
 * Authentication Audit Events Service
 * Task: BE-039 (Authentication Audit Events)
 * SRS Traceability: Section 13 (Security Requirements), FR-03 (Session Management)
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError } from '../../utils/errors.js'

/**
 * Audit event types
 * Auth events (BE-039) + Domain events (BE-150)
 */
export const AUDIT_EVENT_TYPES = {
  // --- Authentication Events (BE-039) ---
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',

  // --- Requisition & Issue Events (BE-150) ---
  REQUISITION_SUBMITTED: 'REQUISITION_SUBMITTED',
  REQUISITION_APPROVED: 'REQUISITION_APPROVED',
  REQUISITION_REJECTED: 'REQUISITION_REJECTED',
  SIV_PREPARED: 'SIV_PREPARED',
  SIV_APPROVED: 'SIV_APPROVED',
  SIV_FINALIZED: 'SIV_FINALIZED',

  // --- Return Events (BE-150) ---
  RETURN_SUBMITTED: 'RETURN_SUBMITTED',
  RETURN_EVALUATED: 'RETURN_EVALUATED',
  RETURN_APPROVED: 'RETURN_APPROVED',

  // --- Transfer Events (BE-150) ---
  TRANSFER_SUBMITTED: 'TRANSFER_SUBMITTED',
  TRANSFER_APPROVED: 'TRANSFER_APPROVED',
  TRANSFER_EXECUTED: 'TRANSFER_EXECUTED',

  // --- Disposal Events (BE-150) ---
  DISPOSAL_SUBMITTED: 'DISPOSAL_SUBMITTED',
  DISPOSAL_REQUESTED: 'DISPOSAL_REQUESTED',
  DISPOSAL_APPROVED: 'DISPOSAL_APPROVED',
  DISPOSAL_EXECUTED: 'DISPOSAL_EXECUTED',

  // --- Goods Receipt & Stock Events (BE-150) ---
  GRN_FINALIZED: 'GRN_FINALIZED',
  STOCK_ADJUSTMENT_POSTED: 'STOCK_ADJUSTMENT_POSTED',

  // --- Alert Events (BE-150) ---
  LOW_STOCK_ALERT: 'LOW_STOCK_ALERT',
  SHELF_LIFE_WARNING: 'SHELF_LIFE_WARNING',
  DISPOSAL_CANDIDATE_FLAGGED: 'DISPOSAL_CANDIDATE_FLAGGED',
}

/**
 * Create an audit event
 * @param {Object} eventData - { eventType, userId, details, ipAddress, userAgent }
 * @returns {Promise<Object>} Created audit event
 */
export const createAuditEvent = async ({ eventType, userId, details, ipAddress, userAgent }) => {
  if (!eventType || !Object.values(AUDIT_EVENT_TYPES).includes(eventType)) {
    throw new ValidationError('Invalid event type')
  }

  const event = await prisma.auditEvent.create({
    data: {
      eventType,
      userId: userId || null,
      details: details || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      timestamp: new Date(),
    },
    select: {
      id: true,
      eventType: true,
      userId: true,
      details: true,
      ipAddress: true,
      userAgent: true,
      timestamp: true,
      createdAt: true,
    },
  })

  return event
}

/**
 * Get audit events with pagination and filtering
 * @param {Object} options - { page, limit, eventType, userId, startDate, endDate }
 * @returns {Promise<Object>} Paginated audit events
 */
export const getAuditEvents = async ({
  page = 1,
  limit = 10,
  eventType = null,
  userId = null,
  startDate = null,
  endDate = null,
} = {}) => {
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10))
  const skip = (pageNum - 1) * limitNum

  const where = {}
  if (eventType) {
    where.eventType = eventType.toUpperCase()
  }
  if (userId) {
    where.userId = userId
  }
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }

  const [events, totalItems] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        eventType: true,
        userId: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        timestamp: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.auditEvent.count({ where }),
  ])

  return {
    events,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
    },
  }
}

/**
 * Get audit event by ID
 * @param {string} eventId - Event UUID
 * @returns {Promise<Object>} Audit event
 */
export const getAuditEventById = async (eventId) => {
  const event = await prisma.auditEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      eventType: true,
      userId: true,
      details: true,
      ipAddress: true,
      userAgent: true,
      timestamp: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  })

  if (!event) {
    throw new NotFoundError(`Audit event with ID '${eventId}' not found`)
  }

  return event
}

/**
 * Get audit events for a specific user
 * @param {string} userId - User UUID
 * @param {Object} options - { page, limit }
 * @returns {Promise<Object>} Paginated audit events
 */
export const getUserAuditEvents = async (userId, { page = 1, limit = 10 } = {}) => {
  return getAuditEvents({ page, limit, userId })
}

/**
 * Get audit events by type
 * @param {string} eventType - Event type
 * @param {Object} options - { page, limit }
 * @returns {Promise<Object>} Paginated audit events
 */
export const getAuditEventsByType = async (eventType, { page = 1, limit = 10 } = {}) => {
  return getAuditEvents({ page, limit, eventType })
}

/**
 * Get recent audit events
 * @param {number} limit - Number of recent events to return
 * @returns {Promise<Array>} Recent audit events
 */
export const getRecentAuditEvents = async (limit = 20) => {
  const events = await prisma.auditEvent.findMany({
    take: Math.min(100, Math.max(1, limit)),
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      eventType: true,
      userId: true,
      details: true,
      ipAddress: true,
      userAgent: true,
      timestamp: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  })

  return events
}

/**
 * Delete old audit events
 * @param {number} daysOld - Number of days old to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteOldAuditEvents = async (daysOld = 90) => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.auditEvent.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  })

  return {
    deleted: result.count,
    cutoffDate,
  }
}
