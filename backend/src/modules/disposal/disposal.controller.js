/**
 * Disposal Controller (Thin Presentation / Controller Layer)
 * Tasks: BE-137, BE-138, BE-139, BE-140
 * SRS Traceability: Section 7.1 (Disposal State Model), Section 13 (Security), BR-18, FR-38, FR-39
 */

import {
  createDisposalRequest,
  getDisposalById,
  listDisposalRequests,
  approveDisposalRequest,
  rejectDisposalRequest,
  executeDisposal,
  getDisposalAuditHistory,
} from './disposal.service.js'
import { sendCreated, sendSuccess, sendPaginated } from '../../utils/response.js'

/**
 * Handle POST /api/disposal-requests endpoint (BE-137)
 */
export const create = async (req, res, next) => {
  try {
    const requesterId = req.user?.userId || req.user?.id || 'usr-uuid-requester'
    const disposal = await createDisposalRequest({
      ...req.body,
      requesterId,
    })
    return sendCreated(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle GET /api/disposal-requests/:id endpoint
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
 * Handle GET /api/disposal-requests endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listDisposalRequests(req.query)
    return sendPaginated(
      res,
      result.disposalRequests,
      result.page,
      req.query.limit || 10,
      result.total
    )
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle PATCH /api/disposal-requests/:id/approve endpoint (BE-138)
 */
export const approve = async (req, res, next) => {
  try {
    const approverId = req.user?.userId || req.user?.id || 'usr-pao-officer'
    const disposal = await approveDisposalRequest({
      id: req.params.id,
      approverId,
      approvalNotes: req.body.approvalNotes,
      disposalMethod: req.body.disposalMethod,
    })
    return sendSuccess(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle PATCH /api/disposal-requests/:id/reject endpoint (BE-138)
 */
export const reject = async (req, res, next) => {
  try {
    const rejectedById = req.user?.userId || req.user?.id || 'usr-pao-officer'
    const disposal = await rejectDisposalRequest({
      id: req.params.id,
      rejectedById,
      rejectionReason: req.body.reason,
    })
    return sendSuccess(res, disposal)
  } catch (err) {
    return next(err)
  }
}

/**
 * Handle POST /api/disposal-requests/:id/execute endpoint (BE-139)
 */
export const execute = async (req, res, next) => {
  try {
    const executedBy = req.user?.userId || req.user?.id || 'usr-pao-officer'
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
 * Handle GET /api/disposal-requests/:id/history endpoint (BE-140)
 */
export const getAuditHistory = async (req, res, next) => {
  try {
    const history = await getDisposalAuditHistory(req.params.id)
    return sendSuccess(res, history)
  } catch (err) {
    return next(err)
  }
}
