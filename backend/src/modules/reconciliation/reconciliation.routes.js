/**
 * Reconciliation Request Router & OpenAPI Specs
 * Tasks: BE-146, BE-147 (Implement Inventory Adjustment Posting)
 */

import { Router } from 'express'
import { create, getById, list, approve, postAdjustments } from './reconciliation.controller.js'
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

/**
 * @openapi
 * /reconciliations/{id}/post:
 *   post:
 *     summary: Post approved inventory adjustments through the transaction posting engine (BE-086, SRS BR-19)
 *     tags:
 *       - Stock Taking & Reconciliation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Approved reconciliation variances posted as stock card adjustments in POSTED state
 */
router.post(
  '/:id/post',
  authenticate,
  authorize(PERMISSIONS.RECONCILIATION_POST),
  postAdjustments
)

router.get('/', authenticate, authorize(PERMISSIONS.RECONCILIATION_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.RECONCILIATION_READ), getById)

export default router
