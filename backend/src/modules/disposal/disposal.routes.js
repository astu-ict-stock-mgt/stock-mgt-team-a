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
  approveDisposalSchema,
  rejectDisposalSchema,
  executeDisposalSchema,
} from './dto/disposal.dto.js'

const router = Router()

/**
 * @openapi
 * /disposal-requests:
 *   post:
 *     summary: Create a new Disposal Request
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
 *               - storeId
 *               - reason
 *               - lines
 *             properties:
 *               storeId:
 *                 type: string
 *               disposalMethod:
 *                 type: string
 *                 enum: [AUCTION, DONATION, DESTRUCTION, RECYCLE, TRANSFER, WRITE_OFF]
 *               reason:
 *                 type: string
 *               remarks:
 *                 type: string
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - quantity
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     locationId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     unitCost:
 *                       type: number
 *                     condition:
 *                       type: string
 *     responses:
 *       201:
 *         description: Disposal request created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.DISPOSAL_REQUEST),
  validateRequest({ body: createDisposalSchema }),
  create
)

/**
 * @openapi
 * /disposal-requests/{id}/approve:
 *   patch:
 *     summary: Approve Disposal Request (PAO / Authorized Committee)
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
 *               approvalNotes:
 *                 type: string
 *               disposalMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disposal request approved successfully
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.DISPOSAL_APPROVE),
  validateRequest({ body: approveDisposalSchema }),
  approve
)

/**
 * @openapi
 * /disposal-requests/{id}/reject:
 *   patch:
 *     summary: Reject Disposal Request
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
 *         description: Disposal request rejected successfully
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize(PERMISSIONS.DISPOSAL_APPROVE),
  validateRequest({ body: rejectDisposalSchema }),
  reject
)

/**
 * @openapi
 * /disposal-requests/{id}/execute:
 *   post:
 *     summary: Execute Disposal Request and Post Stock-Out Transaction (BE-139)
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
 *       403:
 *         description: Forbidden - Requires disposal:execute permission
 *       404:
 *         description: Disposal request not found
 *       409:
 *         description: Conflict - Invalid status or insufficient stock
 */
router.post(
  '/:id/execute',
  authenticate,
  authorize(PERMISSIONS.DISPOSAL_EXECUTE),
  validateRequest({ body: executeDisposalSchema }),
  execute
)

/**
 * @openapi
 * /disposal-requests/{id}/history:
 *   get:
 *     summary: Get Disposal Request Audit Trail and Ledger Postings (BE-140)
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
  authorize(PERMISSIONS.DISPOSAL_REQUEST),
  getAuditHistory
)

router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.DISPOSAL_REQUEST),
  list
)

router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.DISPOSAL_REQUEST),
  getById
)

export default router
