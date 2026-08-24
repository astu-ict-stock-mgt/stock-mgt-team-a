/**
 * Disposal Domain Router & OpenAPI Specs
 * Tasks: BE-137, BE-138, BE-139, BE-140
 * SRS Traceability: Section 7.1 (Disposal State Model), Section 13 (Security), BR-18, FR-38, FR-39
 */

import { Router } from 'express'
import {
  create,
  getById,
  list,
  evaluate,
  approve,
  reject,
  execute,
  getAuditHistory,
} from './disposal.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import {
  createDisposalSchema,
  evaluateDisposalSchema,
  approveDisposalSchema,
  rejectDisposalSchema,
  executeDisposalSchema,
} from './dto/disposal.dto.js'

const router = Router()

/**
 * @openapi
 * /disposals:
 *   post:
 *     summary: Create a new Disposal Request (BE-137)
 *     tags:
 *       - Disposal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - disposalMethod
 *             properties:
 *               disposalMethod:
 *                 type: string
 *                 enum: [AUCTION, DONATION, DESTRUCTION, RECYCLING, TRANSFER_OUT, WRITE_OFF]
 *               storeId:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Disposal request created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.DISPOSALS_CREATE),
  validateRequest({ body: createDisposalSchema }),
  create
)

/**
 * @openapi
 * /disposals/{id}/evaluate:
 *   patch:
 *     summary: Disposal Committee Evaluation (BE-137)
 *     tags:
 *       - Disposal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disposal Request evaluated successfully
 */
router.patch(
  '/:id/evaluate',
  authenticate,
  authorize(PERMISSIONS.DISPOSALS_EVALUATE),
  validateRequest({ body: evaluateDisposalSchema }),
  evaluate
)

/**
 * @openapi
 * /disposals/{id}/approve:
 *   patch:
 *     summary: PAO Officer Approval (BE-138)
 *     tags:
 *       - Disposal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               disposalMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disposal Request approved successfully
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.DISPOSALS_APPROVE),
  validateRequest({ body: approveDisposalSchema }),
  approve
)

/**
 * @openapi
 * /disposals/{id}/reject:
 *   patch:
 *     summary: Reject Disposal Request (BE-138)
 *     tags:
 *       - Disposal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disposal Request rejected successfully
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize(PERMISSIONS.DISPOSALS_APPROVE),
  validateRequest({ body: rejectDisposalSchema }),
  reject
)

/**
 * @openapi
 * /disposals/{id}/execute:
 *   post:
 *     summary: Execute Disposal and Post Stock-Out (BE-139)
 *     tags:
 *       - Disposal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               executionNotes:
 *                 type: string
 *               witnessName:
 *                 type: string
 *               certificateNumber:
 *                 type: string
 *               disposalLocation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disposal executed successfully and stock deducted
 *       409:
 *         description: Conflict - Invalid status or insufficient stock
 */
router.post(
  '/:id/execute',
  authenticate,
  authorize(PERMISSIONS.DISPOSALS_EXECUTE),
  validateRequest({ body: executeDisposalSchema }),
  execute
)

/**
 * @openapi
 * /disposals/{id}/history:
 *   get:
 *     summary: Get Disposal Audit Trail (BE-140)
 *     tags:
 *       - Disposal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Disposal audit history timeline
 */
router.get(
  '/:id/history',
  authenticate,
  authorize(PERMISSIONS.DISPOSALS_READ),
  getAuditHistory
)

router.get('/', authenticate, authorize(PERMISSIONS.DISPOSALS_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.DISPOSALS_READ), getById)

export default router
