/**
 * Disposal Request Router & OpenAPI Specs
 * Task: BE-137 (Implement Disposal Request API)
 */

import { Router } from 'express'
import { create, getById, list, evaluate, approve } from './disposal.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createDisposalSchema, evaluateDisposalSchema, approveDisposalSchema } from './dto/disposal.dto.js'

const router = Router()

/**
 * @openapi
 * /disposals:
 *   post:
 *     summary: Submit a new Disposal Request
 *     tags:
 *       - Disposal Module
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
 *                 enum: [AUCTION, DONATION, DESTRUCTION, RECYCLING, TRANSFER_OUT]
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Disposal Request submitted successfully in SUBMITTED state
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
 *     summary: Disposal Committee Evaluation of Request
 *     tags:
 *       - Disposal Module
 *     security:
 *       - bearerAuth: []
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
 *     summary: PAO Officer Approval or Rejection of Disposal Request
 *     tags:
 *       - Disposal Module
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disposal Request approved or rejected successfully
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.DISPOSALS_APPROVE),
  validateRequest({ body: approveDisposalSchema }),
  approve
)

router.get('/', authenticate, authorize(PERMISSIONS.DISPOSALS_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.DISPOSALS_READ), getById)

export default router
