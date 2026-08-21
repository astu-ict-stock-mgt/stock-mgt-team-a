/**
 * Authentication Audit Events Controller
 * Task: BE-039 (Authentication Audit Events)
 * SRS Traceability: Section 13 (Security Requirements)
 */

import {
  createAuditEvent,
  getAuditEvents,
  getAuditEventById,
  getUserAuditEvents,
  getAuditEventsByType,
  getRecentAuditEvents,
  deleteOldAuditEvents,
  AUDIT_EVENT_TYPES,
} from './audit.service.js'
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js'

/**
 * Get all audit events with pagination
 */
export const listAuditEvents = async (req, res, next) => {
  try {
    const { page, limit, eventType, userId, startDate, endDate } = req.query
    const result = await getAuditEvents({ page, limit, eventType, userId, startDate, endDate })
    sendPaginated(res, result.events, result.pagination.page, result.pagination.limit, result.pagination.totalItems)
  } catch (err) {
    next(err)
  }
}

/**
 * Get audit event by ID
 */
export const getAuditEvent = async (req, res, next) => {
  try {
    const event = await getAuditEventById(req.params.eventId)
    sendSuccess(res, event)
  } catch (err) {
    next(err)
  }
}

/**
 * Get audit events for a specific user
 */
export const listUserAuditEvents = async (req, res, next) => {
  try {
    const { page, limit } = req.query
    const result = await getUserAuditEvents(req.params.userId, { page, limit })
    sendPaginated(res, result.events, result.pagination.page, result.pagination.limit, result.pagination.totalItems)
  } catch (err) {
    next(err)
  }
}

/**
 * Get audit events by type
 */
export const listAuditEventsByType = async (req, res, next) => {
  try {
    const { page, limit } = req.query
    const result = await getAuditEventsByType(req.params.eventType, { page, limit })
    sendPaginated(res, result.events, result.pagination.page, result.pagination.limit, result.pagination.totalItems)
  } catch (err) {
    next(err)
  }
}

/**
 * Get recent audit events
 */
export const listRecentAuditEvents = async (req, res, next) => {
  try {
    const { limit } = req.query
    const events = await getRecentAuditEvents(parseInt(limit) || 20)
    sendSuccess(res, events)
  } catch (err) {
    next(err)
  }
}

/**
 * Create a new audit event
 */
export const createNewAuditEvent = async (req, res, next) => {
  try {
    const { eventType, userId, details, ipAddress, userAgent } = req.body
    const event = await createAuditEvent({ eventType, userId, details, ipAddress, userAgent })
    sendCreated(res, event)
  } catch (err) {
    next(err)
  }
}

/**
 * Delete old audit events
 */
export const deleteOldEvents = async (req, res, next) => {
  try {
    const { daysOld } = req.body
    const result = await deleteOldAuditEvents(parseInt(daysOld) || 90)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Get audit event types
 */
export const getEventTypes = async (req, res, next) => {
  try {
    sendSuccess(res, Object.values(AUDIT_EVENT_TYPES))
  } catch (err) {
    next(err)
  }
}
