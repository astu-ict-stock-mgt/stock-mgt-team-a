/**
 * Notifications Controller
 * Task: BE-150
 * SRS Traceability: Section 6.6 (Notifications), FR-43, UC-38
 *
 * Security:
 * - All handlers extract userId from req.user (JWT-verified by auth.middleware)
 * - NEVER trusts userId from req.body or req.query
 * - Ownership is verified at service level before any mutation
 */

import * as notificationsService from './notifications.service.js'
import { sendSuccess, sendCreated } from '../../utils/response.js'

// ─────────────────────────────────────────────────────────────────
// Helper: extract authenticated user ID from JWT payload
// ─────────────────────────────────────────────────────────────────
function getAuthUserId(req) {
  return req.user?.userId || req.user?.id
}

// ─────────────────────────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────────────────────────
export const list = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req)
    const result = await notificationsService.getUserNotifications(userId, req.query)
    return sendSuccess(res, result.notifications, 200, {
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    return next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// ─────────────────────────────────────────────────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req)
    const count = await notificationsService.getUnreadCount(userId)
    return sendSuccess(res, { unreadCount: count })
  } catch (err) {
    return next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/notifications/:id
// ─────────────────────────────────────────────────────────────────
export const getById = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req)
    const notification = await notificationsService.getNotificationById(req.params.id)

    if (!notification) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } })
    }
    // Security: user can only see their own notifications
    if (notification.userId !== userId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } })
    }

    return sendSuccess(res, notification)
  } catch (err) {
    return next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read  (also accepts POST for compat)
// ─────────────────────────────────────────────────────────────────
export const markRead = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req)
    const result = await notificationsService.markAsRead(req.params.id, userId)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all  (also accepts POST /mark-all-read)
// ─────────────────────────────────────────────────────────────────
export const markAllRead = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req)
    const result = await notificationsService.markAllAsRead(userId)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// ─────────────────────────────────────────────────────────────────
export const remove = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req)
    const result = await notificationsService.deleteNotification(req.params.id, userId)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/notifications  (admin/system use only)
// ─────────────────────────────────────────────────────────────────
export const create = async (req, res, next) => {
  try {
    const result = await notificationsService.createNotification(req.body)
    return sendCreated(res, result)
  } catch (err) {
    return next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// Trigger endpoints (admin / cron use)
// ─────────────────────────────────────────────────────────────────
export const triggerExpiryCheck = async (req, res, next) => {
  try {
    const daysUntilExpiry = parseInt(req.query.days || '30', 10)
    const result = await notificationsService.generateExpiryNotifications(daysUntilExpiry)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const triggerLowStockCheck = async (req, res, next) => {
  try {
    const result = await notificationsService.generateLowStockNotifications()
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const triggerDisposalCheck = async (req, res, next) => {
  try {
    const result = await notificationsService.generateDisposalCandidateNotifications()
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}
