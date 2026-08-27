/**
 * Notification Routes
 * Task: BE-150
 * SRS Traceability: FR-43, UC-38
 *
 * All routes require authentication (JWT via authenticate middleware).
 * Users can only access their own notifications — enforced at service layer.
 *
 * Routes:
 *   GET    /api/notifications              — list own notifications (paginated)
 *   GET    /api/notifications/unread-count — fast unread count for polling
 *   GET    /api/notifications/:id          — single notification (ownership verified)
 *   PATCH  /api/notifications/read-all    — mark all own notifications read
 *   PATCH  /api/notifications/:id/read    — mark single notification read
 *   POST   /api/notifications/mark-all-read — backward-compatible alias
 *   POST   /api/notifications/:id/read      — backward-compatible alias
 *   DELETE /api/notifications/:id          — delete own notification
 *
 *   Admin/system-only:
 *   POST   /api/notifications              — create notification (inventory.create)
 *   POST   /api/notifications/trigger-expiry-check
 *   POST   /api/notifications/trigger-low-stock-check
 *   POST   /api/notifications/trigger-disposal-check
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import * as controller from './notifications.controller.js'

const router = Router()

// All notification routes require a valid JWT
router.use(authenticate)

// ─────────────────────────────────────────────────────────────────
// Static-path routes MUST come before /:id to avoid conflicts
// ─────────────────────────────────────────────────────────────────

// GET /api/notifications/unread-count — polling endpoint
router.get('/unread-count', controller.getUnreadCount)

// PATCH /api/notifications/read-all — SRS UC-38: mark all as read
router.patch('/read-all', controller.markAllRead)

// POST /api/notifications/mark-all-read — backward-compatible alias
router.post('/mark-all-read', controller.markAllRead)

// POST /api/notifications — admin/system: create notification directly
router.post('/', authorize(['inventory.create']), controller.create)

// Trigger endpoints (admin/cron use only)
router.post('/trigger-expiry-check', authorize(['inventory.update']), controller.triggerExpiryCheck)
router.post('/trigger-low-stock-check', authorize(['inventory.update']), controller.triggerLowStockCheck)
router.post('/trigger-disposal-check', authorize(['inventory.update']), controller.triggerDisposalCheck)

// ─────────────────────────────────────────────────────────────────
// Dynamic /:id routes
// ─────────────────────────────────────────────────────────────────

// GET /api/notifications — list own notifications
router.get('/', controller.list)

// GET /api/notifications/:id — single notification
router.get('/:id', controller.getById)

// PATCH /api/notifications/:id/read — mark single notification read
router.patch('/:id/read', controller.markRead)

// POST /api/notifications/:id/read — backward-compatible alias
router.post('/:id/read', controller.markRead)

// DELETE /api/notifications/:id — delete own notification
router.delete('/:id', controller.remove)

export default router
