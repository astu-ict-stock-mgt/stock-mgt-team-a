/**
 * Disposal Controller (Thin Presentation / Controller Layer)
 * Tasks: BE-137, BE-138, BE-139, BE-140
 * SRS Traceability: Section 7.1 (Disposal State Model), Section 13 (Security), BR-18, FR-38, FR-39
 */

import {
  createDisposalRequest,
  getDisposalById,
  listDisposalRequests,
  evaluateDisposalRequest,
  approveDisposalRequest,
  rejectDisposalRequest,
  executeDisposal,
  getDisposalAuditHistory,
} from './disposal.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/disposals endpoint (BE-137)
 */
export const create = async (req, res, next) => {
  try {
    const requestedBy = req.user?.userId || req.user?.id
    const disposal = await createDisposalRequest({
      ...req.body,
      requestedBy,
    })
    return sendCreated(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle GET /api/disposals/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const disposal = await getDisposalById(req.params.id)
    return sendSuccess(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle GET /api/disposals endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listDisposalRequests(req.query)
    return sendSuccess(res, result.disposals, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle PATCH /api/disposals/:id/evaluate endpoint
 */
export const evaluate = async (req, res, next) => {
  try {
    const result = await evaluateDisposalRequest({
      id: req.params.id,
      evaluatedBy: req.user?.userId || req.user?.id,
      ...req.body,
    })
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle PATCH /api/disposals/:id/approve endpoint (BE-138)
 */
export const approve = async (req, res, next) => {
  try {
    const approvedBy = req.user?.userId || req.user?.id
    const disposal = await approveDisposalRequest({
      id: req.params.id,
      approvedBy,
      approvalNotes: req.body.notes,
      disposalMethod: req.body.disposalMethod,
    })
    return sendSuccess(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle PATCH /api/disposals/:id/reject endpoint (BE-138)
 */
export const reject = async (req, res, next) => {
  try {
    const approvedBy = req.user?.userId || req.user?.id
    const disposal = await rejectDisposalRequest({
      id: req.params.id,
      approvedBy,
      rejectionReason: req.body.reason,
    })
    return sendSuccess(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle POST /api/disposals/:id/execute endpoint (BE-139)
 */
export const execute = async (req, res, next) => {
  try {
    const executedBy = req.user?.userId || req.user?.id
    const disposal = await executeDisposal({
      id: req.params.id,
      executedBy,
      executionNotes: req.body.executionNotes,
      witnessName: req.body.witnessName,
      certificateNumber: req.body.certificateNumber,
      disposalLocation: req.body.disposalLocation,
    })
    return sendSuccess(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle GET /api/disposals/:id/history endpoint (BE-140)
 */
export const getAuditHistory = async (req, res, next) => {
  try {
    const history = await getDisposalAuditHistory(req.params.id)
    return sendSuccess(res, history)
  } catch (err) {
    return next(err)
  }
}
