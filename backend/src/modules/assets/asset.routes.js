/**
 * Fixed Asset Router & OpenAPI Specs
 * Tasks: BE-130, BE-131 (Implement Asset Lifecycle API)
 */

import { Router } from 'express'
import { create, getById, list, updateCustody, updateStatus } from './asset.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createAssetSchema, assignCustodySchema, updateAssetStatusSchema } from './dto/asset.dto.js'

const router = Router()

/**
 * @openapi
 * /assets:
 *   post:
 *     summary: Register a new Fixed Asset
 *     tags:
 *       - Fixed Assets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               itemId:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               category:
 *                 type: string
 *               purchaseCost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Fixed asset registered successfully in REGISTERED state
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.ASSETS_REGISTER),
  validateRequest({ body: createAssetSchema }),
  create
)

/**
 * @openapi
 * /assets/{id}/custody:
 *   patch:
 *     summary: Assign or transfer asset custodian
 *     tags:
 *       - Fixed Assets
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
 *         description: Asset custody assigned successfully
 */
router.patch(
  '/:id/custody',
  authenticate,
  authorize(PERMISSIONS.ASSETS_REGISTER),
  validateRequest({ body: assignCustodySchema }),
  updateCustody
)

/**
 * @openapi
 * /assets/{id}/status:
 *   patch:
 *     summary: Transition fixed asset lifecycle status (REGISTERED -> IN_SERVICE -> UNDER_MAINTENANCE -> DISPOSED)
 *     tags:
 *       - Fixed Assets
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REGISTERED, IN_SERVICE, UNDER_MAINTENANCE, DISPOSED, WRITTEN_OFF]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fixed asset status updated successfully
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(PERMISSIONS.ASSETS_REGISTER),
  validateRequest({ body: updateAssetStatusSchema }),
  updateStatus
)

router.get('/', authenticate, authorize(PERMISSIONS.ASSETS_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.ASSETS_READ), getById)

export default router
