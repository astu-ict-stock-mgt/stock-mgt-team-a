/**
 * Disposal Request Controller
 * Tasks: BE-137, BE-138, BE-140 (Implement Disposal Evidence/Completion API)
 * SRS Traceability: Section 11 (Disposal Module)
 */

import {
  createDisposalRequest,
  getDisposalById,
  listDisposalRequests,
  evaluateDisposalRequest,
  approveDisposalRequest,
  completeDisposalRequest,
} from './disposal.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/disposals endpoint
 */
export const create = async (req, res, next) => {
  try {
    const record = await createDisposalRequest({
      requestedBy: req.user.userId,
      ...req.body,
    })
    sendCreated(res, record)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/disposals/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const record = await getDisposalById(req.params.id)
    sendSuccess(res, record)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/disposals endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listDisposalRequests(req.query)
    sendSuccess(res, result.disposals, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/disposals/:id/evaluate endpoint
 */
export const evaluate = async (req, res, next) => {
  try {
    const result = await evaluateDisposalRequest({
      id: req.params.id,
      evaluatedBy: req.user.userId,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/disposals/:id/approve endpoint
 */
export const approve = async (req, res, next) => {
  try {
    const result = await approveDisposalRequest({
      id: req.params.id,
      approvedBy: req.user.userId,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/disposals/:id/complete endpoint (BE-140)
 */
export const complete = async (req, res, next) => {
  try {
    const result = await completeDisposalRequest({
      id: req.params.id,
      executedBy: req.user.userId,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
