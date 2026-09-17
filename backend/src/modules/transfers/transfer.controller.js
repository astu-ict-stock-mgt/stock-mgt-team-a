/**
 * Stock Transfer Request (STR) Controller
 * Tasks: BE-123, BE-124 (Implement Transfer Request APIs)
 * SRS Traceability: Section 8 (Stock Transfer Module)
 */

import {
  createTransfer,
  getTransferById,
  listTransfers,
  approveTransfer,
  dispatchTransfer,
  completeTransfer,
  acknowledgeTransfer,
} from './transfer.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/transfers endpoint
 */
export const create = async (req, res, next) => {
  try {
    const requestedBy = req.user?.userId || req.user?.id || 'usr-storekeeper-1'
    const userRoles = req.user?.roles || []
    const transfer = await createTransfer({
      ...req.body,
      requestedBy,
      userRoles,
    })
    sendCreated(res, transfer)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/transfers/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const transfer = await getTransferById(req.params.id)
    sendSuccess(res, transfer)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/transfers endpoint
 */
export const list = async (req, res, next) => {
  try {
    const userRoles = req.user?.roles || []
    const isOfficer = userRoles.some(r => ['ADMIN', 'SUPER_ADMIN', 'PAO'].includes(r))
    const isStorekeeper = userRoles.includes('STOREKEEPER') && !isOfficer
    const isDeptHead = userRoles.includes('DEPARTMENT_HEAD') && !isOfficer
    const filters = { ...req.query }

    // Storekeeper only views store-to-store warehouse transfers
    if (isStorekeeper) {
      filters.isStorekeeperOnly = true
    }

    // Non-central officers:
    // - Storekeepers see warehouse store transfers (isStorekeeperOnly = true)
    // - Dept Heads and Requesters are participant-scoped
    if (!isOfficer && !isStorekeeper && (req.user?.userId || req.user?.id)) {
      filters.userInvolvedId = req.user.userId || req.user.id
      if (isDeptHead) {
        filters.isDeptHead = true
      }
    }

    const result = await listTransfers(filters)
    sendSuccess(res, result.transfers, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/transfers/:id/approve endpoint
 */
export const approve = async (req, res, next) => {
  try {
    const approverId = req.user?.userId || req.user?.id || 'usr-pao-1'
    const userRoles = req.user?.roles || []
    const result = await approveTransfer({
      id: req.params.id,
      approverId,
      userRoles,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/transfers/:id/dispatch endpoint
 */
export const dispatch = async (req, res, next) => {
  try {
    const userRoles = req.user?.roles || []
    const result = await dispatchTransfer({ id: req.params.id, userRoles })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/transfers/:id/acknowledge endpoint (Article 19 receipt confirmation)
 */
export const acknowledge = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id
    const userRoles = req.user?.roles || []
    const result = await acknowledgeTransfer({
      id: req.params.id,
      userId,
      userRoles,
      notes: req.body?.notes,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/transfers/:id/complete endpoint
 */
export const complete = async (req, res, next) => {
  try {
    const executionUserId = req.user?.userId || req.user?.id
    const userRoles = req.user?.roles || []
    const result = await completeTransfer({
      id: req.params.id,
      executionUserId,
      userRoles,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
