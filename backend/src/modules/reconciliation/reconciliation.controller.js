/**
 * Reconciliation Request Controller
 * Task: BE-146 (Implement Reconciliation Approval API)
 * SRS Traceability: Section 12 (Stock Taking & Reconciliation)
 */

import {
  createReconciliation,
  getReconciliationById,
  listReconciliations,
  approveReconciliation,
} from './reconciliation.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/reconciliations endpoint
 */
export const create = async (req, res, next) => {
  try {
    const record = await createReconciliation({
      initiatedBy: req.user.id || req.user.userId,
      ...req.body,
    })
    sendCreated(res, record)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/reconciliations/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const record = await getReconciliationById(req.params.id)
    sendSuccess(res, record)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/reconciliations endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listReconciliations(req.query)
    sendSuccess(res, result.reconciliations, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/reconciliations/:id/approve endpoint (BE-146)
 */
export const approve = async (req, res, next) => {
  try {
    const result = await approveReconciliation({
      id: req.params.id,
      approvedBy: req.user.id || req.user.userId,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
