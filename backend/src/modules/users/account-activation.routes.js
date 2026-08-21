/**
 * Account Activation/Deactivation Routes
 * Task: BE-038 (Account Activation/Deactivation)
 * SRS Traceability: FR-01 (User Management)
 */

import { Router } from 'express'
import {
  activate,
  deactivate,
  toggleStatus,
  bulkActivate,
  bulkDeactivate,
} from './account-activation.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { bulkActionSchema } from './dto/user.dto.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

/**
 * @openapi
 * /users/{userId}/activate:
 *   post:
 *     summary: Activate user account
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated
 *       404:
 *         description: User not found
 *       409:
 *         description: User already active
 */
router.post('/:userId/activate', authenticate, authorize(PERMISSIONS.USERS_MANAGE), activate)

/**
 * @openapi
 * /users/{userId}/deactivate:
 *   post:
 *     summary: Deactivate user account
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 *       409:
 *         description: User already inactive
 */
router.post('/:userId/deactivate', authenticate, authorize(PERMISSIONS.USERS_MANAGE), deactivate)

/**
 * @openapi
 * /users/{userId}/toggle-status:
 *   post:
 *     summary: Toggle user account status
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status toggled
 *       404:
 *         description: User not found
 */
router.post('/:userId/toggle-status', authenticate, authorize(PERMISSIONS.USERS_MANAGE), toggleStatus)

/**
 * @openapi
 * /users/bulk/activate:
 *   post:
 *     summary: Bulk activate users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Users activated
 */
router.post('/bulk/activate', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: bulkActionSchema }), bulkActivate)

/**
 * @openapi
 * /users/bulk/deactivate:
 *   post:
 *     summary: Bulk deactivate users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Users deactivated
 */
router.post('/bulk/deactivate', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: bulkActionSchema }), bulkDeactivate)

export default router
