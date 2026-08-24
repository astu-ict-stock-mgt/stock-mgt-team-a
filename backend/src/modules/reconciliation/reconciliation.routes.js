/**
 * Reconciliation Request Router & OpenAPI Specs
 * Task: BE-146 (Implement Reconciliation Approval API)
 */

import { Router } from 'express'
import { create, getById, list, approve } from './reconciliation.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import {
  createReconciliationSchema,
  approveReconciliationSchema,
} from './dto/reconciliation.dto.js'

const router = Router()

/**
 * @openapi
 * /reconciliations:
 *   post:
 *     summary: Initiate a physical count reconciliation session
 *     tags:
 *       - Stock Taking & Reconciliation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reconciliation session created in SUBMITTED state
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.RECONCILIATION_CREATE),
  validateRequest({ body: createReconciliationSchema }),
  create
)

/**
 * @openapi
 * /reconciliations/{id}/approve:
 *   patch:
 *     summary: PAO / Admin approval or rejection of physical count variance (SRS BR-19)
 *     tags:
 *       - Stock Taking & Reconciliation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reconciliation session approved or rejected
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.RECONCILIATION_APPROVE),
  validateRequest({ body: approveReconciliationSchema }),
  approve
)

router.get('/', authenticate, authorize(PERMISSIONS.RECONCILIATION_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.RECONCILIATION_READ), getById)

export default router
