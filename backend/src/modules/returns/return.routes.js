/**
 * Stock Return Note (SRN / Return) Router & OpenAPI Specs
 * Tasks: BE-116, BE-117 (Implement Return Request APIs)
 */

import { Router } from 'express'
import { create, getById, list, evaluate, approve } from './return.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createReturnSchema, evaluateReturnSchema, approveReturnSchema } from './dto/return.dto.js'

const router = Router()

/**
 * @openapi
 * /returns:
 *   post:
 *     summary: Initiate a Store Return Note (SRN / Material Return Request)
 *     tags:
 *       - Stock Returns
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
 *               - lines
 *             properties:
 *               storeId:
 *                 type: string
 *               requisitionId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 enum: [UNUSED, DEFECTIVE, EXPIRED, EXCESS, WRONG_SPECIFICATION]
 *               notes:
 *                 type: string
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - quantityReturned
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     quantityReturned:
 *                       type: integer
 *                     condition:
 *                       type: string
 *     responses:
 *       201:
 *         description: Return request created successfully in SUBMITTED state
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.RETURNS_CREATE),
  validateRequest({ body: createReturnSchema }),
  create
)

/**
 * @openapi
 * /returns/{id}/evaluate:
 *   patch:
 *     summary: Perform technical evaluation for returned materials
 *     tags:
 *       - Stock Returns
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
 *         description: Return request evaluated successfully
 */
router.patch(
  '/:id/evaluate',
  authenticate,
  authorize(PERMISSIONS.RETURNS_EVALUATE),
  validateRequest({ body: evaluateReturnSchema }),
  evaluate
)

/**
 * @openapi
 * /returns/{id}/approve:
 *   patch:
 *     summary: Approve return request and determine stock disposition (SRS C-09)
 *     tags:
 *       - Stock Returns
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
 *         description: Return request approved with disposition decision
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.RETURNS_APPROVE),
  validateRequest({ body: approveReturnSchema }),
  approve
)

router.get('/', authenticate, authorize(PERMISSIONS.RETURNS_CREATE), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.RETURNS_CREATE), getById)

export default router
