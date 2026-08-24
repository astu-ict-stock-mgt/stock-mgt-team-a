/**
 * Stock Return Note (SRN / Return) Controller
 * Tasks: BE-116, BE-117 (Implement Return Request APIs)
 * SRS Traceability: Section 7 (Stock Return Module)
 */

import {
  createReturn,
  getReturnById,
  listReturns,
  evaluateReturn,
  approveReturn,
} from './return.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/returns endpoint
 */
export const create = async (req, res, next) => {
  try {
    const requestedById = req.user?.userId || req.user?.id || 'usr-requester-1'
    const returnRecord = await createReturn({
      ...req.body,
      requestedById,
    })
    sendCreated(res, returnRecord)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/returns/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const returnRecord = await getReturnById(req.params.id)
    sendSuccess(res, returnRecord)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/returns endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listReturns(req.query)
    sendSuccess(res, result.returns, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/returns/:id/evaluate endpoint
 */
export const evaluate = async (req, res, next) => {
  try {
    const evaluatorId = req.user?.userId || req.user?.id || 'usr-evaluator-1'
    const result = await evaluateReturn({
      id: req.params.id,
      evaluatorId,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/returns/:id/approve endpoint
 */
export const approve = async (req, res, next) => {
  try {
    const approverId = req.user?.userId || req.user?.id || 'usr-pao-1'
    const result = await approveReturn({
      id: req.params.id,
      approverId,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
