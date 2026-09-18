/**
 * Asset Return Router
 * Exposes REST endpoints for fixed asset returns, TEC assignment, and inspections
 */

import { Router } from 'express'
import {
  create,
  getById,
  list,
  getMyCustodyAssets,
  assignTec,
  recordInspection,
  approve,
} from './asset-return.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import {
  createAssetReturnSchema,
  assignTecSchema,
  recordInspectionSchema,
  approveAssetReturnSchema,
} from './dto/asset-return.dto.js'

const router = Router({ mergeParams: true })

/**
 * Route: POST / (or /assets/:assetId/returns)
 * Initiate an asset return (Current custodian or authorized administrative user)
 */
router.post(
  '/',
  authenticate,
  validateRequest({ body: createAssetReturnSchema }),
  create
)

/**
 * Route: GET /my-custody-assets
 * Retrieve fixed assets currently held in personal custody by the authenticated user
 * Directive 1095/2017: Personal liability tracking
 */
router.get('/my-custody-assets', authenticate, getMyCustodyAssets)

/**
 * Route: GET /
 * List asset returns with filters
 */
router.get('/', authenticate, list)

/**
 * Route: GET /:id
 * Get asset return details by ID
 */
router.get('/:id', authenticate, getById)

/**
 * Route: POST /:id/assign-tec
 * Assign TEC committee members to the return (PAO / Storekeeper / Admin)
 */
router.post(
  '/:id/assign-tec',
  authenticate,
  authorize(PERMISSIONS.RETURNS_APPROVE),
  validateRequest({ body: assignTecSchema }),
  assignTec
)

router.post(
  '/:id/inspection',
  authenticate,
  authorize(PERMISSIONS.RETURNS_EVALUATE),
  validateRequest({ body: recordInspectionSchema }),
  recordInspection
)

router.post(
  '/:id/inspect',
  authenticate,
  authorize(PERMISSIONS.RETURNS_EVALUATE),
  validateRequest({ body: recordInspectionSchema }),
  recordInspection
)

/**
 * Route: PATCH & POST /:id/approve
 * Final approval and custody handover resolution (PAO only, after all assigned TEC members evaluate)
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.RETURNS_APPROVE),
  validateRequest({ body: approveAssetReturnSchema }),
  approve
)

router.post(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.RETURNS_APPROVE),
  validateRequest({ body: approveAssetReturnSchema }),
  approve
)

export default router
