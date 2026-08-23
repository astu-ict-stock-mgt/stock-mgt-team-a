/**
 * Shelf-Life Router & OpenAPI Specs
 * Task: BE-134 (Implement Expiry/Status Rules)
 */

import { Router } from 'express'
import { createBatch, getById, list, getExpiring, evaluate } from './shelflife.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { createBatchSchema } from './dto/shelflife.dto.js'

const router = Router()

/**
 * @openapi
 * /shelflife/batches:
 *   post:
 *     summary: Register a new shelf-life batch record
 *     tags:
 *       - Shelf-Life & Expiry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - batchNumber
 *               - quantity
 *               - expiryDate
 *             properties:
 *               itemId:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               expiryDate:
 *                 type: string
 *               alertDaysBeforeExpiry:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       201:
 *         description: Batch registered with computed status (HEALTHY, NEAR_EXPIRY, or EXPIRED)
 */
router.post(
  '/batches',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_READ),
  validateRequest({ body: createBatchSchema }),
  createBatch
)

/**
 * @openapi
 * /shelflife/evaluate:
 *   post:
 *     summary: Trigger automated shelf-life status evaluation sweep
 *     tags:
 *       - Shelf-Life & Expiry
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Evaluation summary returned with updated record counts
 */
router.post('/evaluate', authenticate, authorize(PERMISSIONS.INVENTORY_READ), evaluate)

router.get('/batches/expiring', authenticate, authorize(PERMISSIONS.INVENTORY_READ), getExpiring)
router.get('/batches', authenticate, authorize(PERMISSIONS.INVENTORY_READ), list)
router.get('/batches/:id', authenticate, authorize(PERMISSIONS.INVENTORY_READ), getById)

export default router
