/**
 * Stock Transfer Request (STR) Router & OpenAPI Specs
 * Tasks: BE-123, BE-124 (Implement Transfer Request APIs)
 */

import { Router } from 'express'
import { create, getById, list, approve, dispatch, complete } from './transfer.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createTransferSchema, approveTransferSchema } from './dto/transfer.dto.js'

const router = Router()

/**
 * @openapi
 * /transfers:
 *   post:
 *     summary: Initiate a Stock Transfer Request (STR)
 *     tags:
 *       - Stock Transfers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceStoreId
 *               - destinationStoreId
 *               - lines
 *             properties:
 *               transferType:
 *                 type: string
 *                 enum: [BIN_TO_BIN, STORE_TO_STORE, DEPT_TO_STORE, STORE_TO_DEPT]
 *               sourceStoreId:
 *                 type: string
 *               destinationStoreId:
 *                 type: string
 *               notes:
 *                 type: string
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - quantityRequested
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     quantityRequested:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Transfer request created successfully in SUBMITTED state
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.TRANSFERS_CREATE),
  validateRequest({ body: createTransferSchema }),
  create
)

/**
 * @openapi
 * /transfers/{id}/approve:
 *   patch:
 *     summary: Approve or reject a Stock Transfer Request
 *     tags:
 *       - Stock Transfers
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
 *         description: Transfer request status updated to APPROVED or REJECTED
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.TRANSFERS_APPROVE),
  validateRequest({ body: approveTransferSchema }),
  approve
)

/**
 * @openapi
 * /transfers/{id}/dispatch:
 *   patch:
 *     summary: Dispatch approved transfer (Status -> IN_TRANSIT)
 *     tags:
 *       - Stock Transfers
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
 *         description: Transfer request dispatched
 */
router.patch(
  '/:id/dispatch',
  authenticate,
  authorize(PERMISSIONS.TRANSFERS_EXECUTE),
  dispatch
)

/**
 * @openapi
 * /transfers/{id}/complete:
 *   patch:
 *     summary: Confirm receipt and complete transfer (Status -> COMPLETED)
 *     tags:
 *       - Stock Transfers
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
 *         description: Transfer request completed
 */
router.patch(
  '/:id/complete',
  authenticate,
  authorize(PERMISSIONS.TRANSFERS_EXECUTE),
  complete
)

router.get('/', authenticate, authorize(PERMISSIONS.TRANSFERS_CREATE), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.TRANSFERS_CREATE), getById)

export default router
