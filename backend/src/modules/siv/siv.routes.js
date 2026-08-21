/**
 * Store Issue Voucher (SIV/ISIV) Router & OpenAPI Specs
 * Tasks: BE-105, BE-106 (Implement Preliminary SIV/ISIV API)
 */

import { Router } from 'express'
import { create, getById, list, approve, finalize } from './siv.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createSivSchema } from './dto/siv.dto.js'

const router = Router()

/**
 * @openapi
 * /sivs:
 *   post:
 *     summary: Create a preliminary Store Issue Voucher (SIV/ISIV)
 *     tags:
 *       - Store Issue Vouchers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requisitionId
 *               - storeId
 *               - issuedToUserId
 *               - lines
 *             properties:
 *               requisitionId:
 *                 type: string
 *               storeId:
 *                 type: string
 *               issuedToUserId:
 *                 type: string
 *               notes:
 *                 type: string
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - quantityIssued
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     quantityIssued:
 *                       type: integer
 *                     unitCost:
 *                       type: number
 *     responses:
 *       201:
 *         description: SIV successfully generated in PREPARED state
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.ISSUES_CREATE),
  validateRequest({ body: createSivSchema }),
  create
)

/**
 * @openapi
 * /sivs/{id}/approve:
 *   patch:
 *     summary: Approve SIV Voucher
 *     tags:
 *       - Store Issue Vouchers
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
 *         description: SIV approved successfully
 */
router.patch('/:id/approve', authenticate, authorize(PERMISSIONS.ISSUES_APPROVE), approve)

/**
 * @openapi
 * /sivs/{id}/finalize:
 *   patch:
 *     summary: Finalize SIV Voucher & update requisition issued quantities
 *     tags:
 *       - Store Issue Vouchers
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
 *         description: SIV finalized successfully
 */
router.patch('/:id/finalize', authenticate, authorize(PERMISSIONS.ISSUES_APPROVE), finalize)

router.get('/', authenticate, authorize(PERMISSIONS.ISSUES_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.ISSUES_READ), getById)

export default router
