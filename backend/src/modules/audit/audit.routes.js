/**
 * Authentication Audit Events Routes
 * Task: BE-039 (Authentication Audit Events)
 * SRS Traceability: Section 13 (Security Requirements)
 */

import { Router } from 'express'
import {
  listAuditEvents,
  getAuditEvent,
  listUserAuditEvents,
  listAuditEventsByType,
  listRecentAuditEvents,
  createNewAuditEvent,
  deleteOldEvents,
  getEventTypes,
} from './audit.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { createAuditEventSchema, deleteOldEventsSchema } from './dto/audit.dto.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

/**
 * @openapi
 * /audit:
 *   get:
 *     summary: List all audit events with pagination
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated list of audit events
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize(PERMISSIONS.USERS_READ), listAuditEvents)

/**
 * @openapi
 * /audit/types:
 *   get:
 *     summary: Get all audit event types
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of event types
 *       401:
 *         description: Unauthorized
 */
router.get('/types', authenticate, authorize(PERMISSIONS.USERS_READ), getEventTypes)

/**
 * @openapi
 * /audit/recent:
 *   get:
 *     summary: Get recent audit events
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent audit events
 *       401:
 *         description: Unauthorized
 */
router.get('/recent', authenticate, authorize(PERMISSIONS.USERS_READ), listRecentAuditEvents)

/**
 * @openapi
 * /audit/user/{userId}:
 *   get:
 *     summary: Get audit events for a specific user
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User audit events
 *       401:
 *         description: Unauthorized
 */
router.get('/user/:userId', authenticate, authorize(PERMISSIONS.USERS_READ), listUserAuditEvents)

/**
 * @openapi
 * /audit/type/{eventType}:
 *   get:
 *     summary: Get audit events by type
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Audit events by type
 *       401:
 *         description: Unauthorized
 */
router.get('/type/:eventType', authenticate, authorize(PERMISSIONS.USERS_READ), listAuditEventsByType)

/**
 * @openapi
 * /audit/{eventId}:
 *   get:
 *     summary: Get audit event by ID
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit event details
 *       404:
 *         description: Event not found
 */
router.get('/:eventId', authenticate, authorize(PERMISSIONS.USERS_READ), getAuditEvent)

/**
 * @openapi
 * /audit:
 *   post:
 *     summary: Create a new audit event
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *             properties:
 *               eventType:
 *                 type: string
 *               userId:
 *                 type: string
 *               details:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               userAgent:
 *                 type: string
 *     responses:
 *       201:
 *         description: Audit event created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: createAuditEventSchema }), createNewAuditEvent)

/**
 * @openapi
 * /audit/cleanup:
 *   post:
 *     summary: Delete old audit events
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysOld:
 *                 type: integer
 *                 default: 90
 *     responses:
 *       200:
 *         description: Old events deleted
 *       401:
 *         description: Unauthorized
 */
router.post('/cleanup', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: deleteOldEventsSchema }), deleteOldEvents)

export default router
