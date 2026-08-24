/**
 * Requisition Domain Router
 * Mirrors the authenticate + authorize(PERMISSIONS.X) pattern from
 * backend/src/modules/auth/auth.routes.js.
 *
 * BE-101 adds request DTO validation and OpenAPI docs to the BE-100
 * decision endpoint (route + permission gate already existed from BE-100).
 *
 * ASSUMPTION: the @openapi JSDoc block below follows the swagger-jsdoc
 * convention (comment blocks scanned by a swagger-jsdoc config elsewhere
 * in the repo) since auth.routes.js's header already says "OpenAPI
 * Specification". If the repo instead maintains a separate static
 * openapi.yaml/json, move this block's content there instead.
 */
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { requisitionDecisionDto } from './dto/requisition-decision.dto.js'
import {
  createRequisition,
  submitRequisition,
  getRequisition,
  listRequisitions,
  decideRequisition,
} from './requisition.controller.js'

const router = Router()

router.post('/', authenticate, authorize(PERMISSIONS.REQUISITIONS_CREATE), createRequisition)
router.get('/', authenticate, authorize(PERMISSIONS.REQUISITIONS_READ), listRequisitions)
router.get('/:id', authenticate, authorize(PERMISSIONS.REQUISITIONS_READ), getRequisition)
router.post('/:id/submit', authenticate, authorize(PERMISSIONS.REQUISITIONS_CREATE), submitRequisition)

/**
 * @openapi
 * /api/requisitions/{id}/decision:
 *   post:
 *     summary: Approve or reject a requisition at its current approval stage
 *     description: >
 *       Department Head and PAO both hold requisitions:approve at the
 *       permission-bit level; requisition-approval.service.js additionally
 *       enforces that only the specific department head (or a PAO-role
 *       user) for THIS requisition's current stage may actually decide.
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Requisition ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               reason:
 *                 type: string
 *                 description: Required when decision is REJECT
 *     responses:
 *       200:
 *         description: Decision recorded; requisition status updated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: >
 *           Caller lacks requisitions:approve, or is not the resolved
 *           authority for this requisition's current stage
 *       404:
 *         description: Requisition not found
 *       409:
 *         description: >
 *           Requisition is not currently awaiting a decision, or its
 *           status changed concurrently with this request
 *       422:
 *         description: >
 *           Validation failed — missing/invalid decision, or missing
 *           reason when decision is REJECT
 */
router.post(
  '/:id/decision',
  authenticate,
  authorize(PERMISSIONS.REQUISITIONS_APPROVE),
  validateRequest(requisitionDecisionDto),
  decideRequisition
)

export default router
