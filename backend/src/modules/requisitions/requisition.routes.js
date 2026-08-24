/**
 * Requisition Domain Router & OpenAPI Specs
 * Tasks: BE-098, BE-099, BE-100, BE-102 (Implement Requisition History)
 */

import { Router } from 'express'
import {
  create,
  getById,
  list,
  approveDepartment,
  approvePAO,
  reject,
  getHistory,
} from './requisition.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import {
  createRequisitionSchema,
  approveRequisitionSchema,
  rejectRequisitionSchema,
} from './dto/requisition.dto.js'

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
 *     responses:
 *       201:
 *         description: Requisition successfully created
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.REQUISITIONS_CREATE),
  validateRequest({ body: createRequisitionSchema }),
  create
)

/**
 * @openapi
 * /requisitions/{id}/approve-department:
 *   patch:
 *     summary: Department Head Requisition Approval
 *     tags:
 *       - Requisitions
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
 *         description: Requisition department-approved successfully
 */
router.patch(
  '/:id/approve-department',
  authenticate,
  authorize(PERMISSIONS.REQUISITIONS_APPROVE),
  validateRequest({ body: approveRequisitionSchema }),
  approveDepartment
)

/**
 * @openapi
 * /requisitions/{id}/approve-pao:
 *   patch:
 *     summary: PAO Officer Requisition Approval
 *     tags:
 *       - Requisitions
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
 *         description: Requisition PAO-approved successfully
 */
router.patch(
  '/:id/approve-pao',
  authenticate,
  authorize(PERMISSIONS.REQUISITIONS_APPROVE),
  validateRequest({ body: approveRequisitionSchema }),
  approvePAO
)

/**
 * @openapi
 * /requisitions/{id}/reject:
 *   patch:
 *     summary: Requisition Rejection (Department Head or PAO)
 *     tags:
 *       - Requisitions
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
 *               level:
 *                 type: string
 *                 enum: [DEPARTMENT, PAO]
 *     responses:
 *       200:
 *         description: Requisition rejected successfully
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize(PERMISSIONS.REQUISITIONS_APPROVE),
  validateRequest({ body: rejectRequisitionSchema }),
  reject
)

/**
 * @openapi
 * /requisitions/{id}/history:
 *   get:
 *     summary: Get Requisition Audit History & Event Timeline
 *     tags:
 *       - Requisitions
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
 *         description: Requisition audit history timeline
 *       404:
 *         description: Requisition not found
 */
router.get(
  '/:id/history',
  authenticate,
  authorize(PERMISSIONS.REQUISITIONS_READ),
  getHistory
)

router.get('/', authenticate, authorize(PERMISSIONS.REQUISITIONS_READ), list)
router.get('/:id', authenticate, authorize(PERMISSIONS.REQUISITIONS_READ), getById)

export default router
