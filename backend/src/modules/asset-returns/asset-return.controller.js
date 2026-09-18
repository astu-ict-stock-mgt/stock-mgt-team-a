/**
 * Asset Return Controller
 * Handles HTTP requests for fixed asset returns, TEC assignment, and inspections
 */

import {
  createAssetReturn,
  getAssetReturnById,
  listAssetReturns,
  assignTecMembers,
  recordInspectionAndDecision,
  approveAssetReturn,
} from './asset-return.service.js'
import { sendSuccess, sendCreated } from '../../utils/response.js'
import { prisma } from '../../config/database.js'

/**
 * Retrieve assets currently held in personal custody by the authenticated user
 * Under Directive 1095/2017: Personal custody is strictly filtered by custodianId
 */
export async function getMyCustodyAssets(req, res, next) {
  try {
    const currentUserId = req.user.userId || req.user.id
    const userRoles = req.user.roles || (req.user.role ? [req.user.role] : [])
    const isPaoOrAdmin =
      userRoles.includes('PAO') ||
      userRoles.includes('PROPERTY_ADMIN') ||
      userRoles.includes('ADMIN') ||
      userRoles.includes('SYSTEM_ADMIN')
    const { all } = req.query

    const where = {
      status: { notIn: ['DISPOSED', 'RETIRED'] },
      ...(isPaoOrAdmin && (all === 'true' || all === true)
        ? { custodianId: { not: null } }
        : { custodianId: currentUserId }),
    }

    const assets = await prisma.fixedAsset.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        assetTag: true,
        name: true,
        serialNumber: true,
        status: true,
        custodianId: true,
        custodian: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, code: true } },
      },
    })

    return sendSuccess(res, assets)
  } catch (err) {
    next(err)
  }
}

/**
 * Initiate an asset return
 */
export async function create(req, res, next) {
  try {
    const assetId = req.params.assetId || req.body.assetId
    const { reason, notes } = req.body

    const result = await createAssetReturn({
      assetId,
      reason,
      notes,
      user: req.user,
    })

    return sendCreated(res, result, 'Asset return request initiated successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * Get asset return by ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params
    const result = await getAssetReturnById(id, req.user)
    return sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * List asset returns with filters
 */
export async function list(req, res, next) {
  try {
    const { status, assetId, custodianId, requestedById, assignedTecId, search, page, limit } =
      req.query

    const result = await listAssetReturns({
      status,
      assetId,
      custodianId,
      requestedById,
      assignedTecId,
      search,
      page,
      limit,
    }, req.user)

    return sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Assign TEC evaluators to asset return
 */
export async function assignTec(req, res, next) {
  try {
    const { id } = req.params
    const { tecUserIds } = req.body

    const result = await assignTecMembers({
      id,
      tecUserIds,
      assignedByUserId: req.user.id || req.user.userId,
    })

    return sendSuccess(res, result, 'TEC members assigned successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * Record TEC inspection and decision
 */
export async function recordInspection(req, res, next) {
  try {
    const { id } = req.params
    const inspectionData = req.body

    const result = await recordInspectionAndDecision({
      id,
      inspectionData,
      inspectorUser: req.user,
    })

    return sendSuccess(res, result, 'Return inspection and decision recorded successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * Approve fixed asset return (PAO only, after all assigned TEC members evaluate)
 */
export async function approve(req, res, next) {
  try {
    const { id } = req.params
    const { decision, approvalNotes } = req.body

    const result = await approveAssetReturn({
      id,
      decision,
      approvalNotes,
      user: req.user,
    })

    return sendSuccess(res, result, 'Fixed asset return approved and custody updated successfully')
  } catch (err) {
    next(err)
  }
}
