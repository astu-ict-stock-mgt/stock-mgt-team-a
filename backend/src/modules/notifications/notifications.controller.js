/**
 * Notifications Controller
 * Task: BE-150
 * SRS Traceability: Section 6.6 (Notifications)
 */

import * as notificationsService from './notifications.service.js'
import { sendSuccess, sendCreated } from '../../utils/response.js'

export const create = async (req, res, next) => {
  try {
    const result = await notificationsService.createNotification(req.body)
    return sendCreated(res, result)
  } catch (err) {
    return next(err)
  }
}

export const list = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id
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

export const markRead = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id
    const result = await notificationsService.markAsRead(req.params.id, userId)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id
    const result = await notificationsService.markAllAsRead(userId)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const remove = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id
    const result = await notificationsService.deleteNotification(req.params.id, userId)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const triggerExpiryCheck = async (req, res, next) => {
  try {
    const result = await notificationsService.generateExpiryNotifications()
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
