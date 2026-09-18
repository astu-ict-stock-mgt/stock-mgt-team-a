/**
 * Stock Return Note (SRN / Return) Controller
 * Tasks: BE-116, BE-117 (Implement Return Request APIs)
 * SRS Traceability: Section 7 (Stock Return Module)
 */

import {
  createReturn,
  getReturnById,
  listReturns,
  assignReturnTec,
  evaluateReturn,
  approveReturn,
  postReturnStock,
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
    const returnRecord = await getReturnById(req.params.id, req.user)
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
    const result = await listReturns(req.query, req.user)
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

/**
 * Handle POST /api/returns/:id/post endpoint to execute stock posting
 */
export const postStock = async (req, res, next) => {
  try {
    const postingUserId = req.user?.userId || req.user?.id || 'usr-storekeeper-1'
    const result = await postReturnStock({
      id: req.params.id,
      postingUserId,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/returns/:id/assign-tec endpoint
 */
export const assignTec = async (req, res, next) => {
  try {
    const assignedById = req.user?.userId || req.user?.id
    const tecUserIds = Array.isArray(req.body.tecUserIds) && req.body.tecUserIds.length > 0
      ? req.body.tecUserIds
      : req.body.tecUserId ? [req.body.tecUserId] : []

    const result = await assignReturnTec({
      id: req.params.id,
      assignedById,
      tecUserIds,
      tecUserId: tecUserIds[0],
    })
    sendSuccess(res, result, 200, { message: 'TEC evaluator(s) assigned successfully' })
  } catch (err) {
    next(err)
  }
}

