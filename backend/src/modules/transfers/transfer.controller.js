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
} from './transfer.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/transfers endpoint
 */
export const create = async (req, res, next) => {
  try {
    const requestedBy = req.user?.userId || req.user?.id || 'usr-storekeeper-1'
    const transfer = await createTransfer({
      ...req.body,
      requestedBy,
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
    const result = await listTransfers(req.query)
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
    const result = await approveTransfer({
      id: req.params.id,
      approverId,
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
    const result = await dispatchTransfer({ id: req.params.id })
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
    const result = await completeTransfer({ id: req.params.id })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
