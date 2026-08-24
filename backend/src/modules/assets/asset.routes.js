/**
 * Fixed Asset Router & OpenAPI Specs
 * Task: BE-130 (Implement Asset Registration Service/API)
 */

import { Router } from 'express'
import { create, getById, list, updateCustody } from './asset.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createAssetSchema, assignCustodySchema } from './dto/asset.dto.js'

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

router.get('/', authenticate, authorize(PERMISSIONS.ASSETS_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.ASSETS_READ), getById)

export default router
