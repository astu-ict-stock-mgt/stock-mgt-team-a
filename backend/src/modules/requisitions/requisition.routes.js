/**
 * Requisition Domain Router & OpenAPI Specs
 * Tasks: BE-098, BE-099 (Implement Requisition Create API)
 */

import { Router } from 'express'
import { create, getById, list } from './requisition.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createRequisitionSchema } from './dto/requisition.dto.js'

const router = Router()

/**
 * @openapi
 * /requisitions:
 *   post:
 *     summary: Create a new Store Material Requisition
 *     tags:
 *       - Requisitions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentId
 *               - storeId
 *               - purpose
 *               - lines
 *             properties:
 *               departmentId:
 *                 type: string
 *               storeId:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 example: Quarterly hardware renewal
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - requestedQuantity
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     requestedQuantity:
 *                       type: integer
 *                       example: 5
 *                     remarks:
 *                       type: string
 *     responses:
 *       201:
 *         description: Requisition successfully created
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
  authorize(PERMISSIONS.REQUISITIONS_CREATE),
  validateRequest({ body: createRequisitionSchema }),
  create
)

router.get('/', authenticate, authorize(PERMISSIONS.REQUISITIONS_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.REQUISITIONS_READ), getById)

export default router
