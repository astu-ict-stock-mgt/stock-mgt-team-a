/**
 * Requisition Controller
 * Tasks: BE-098, BE-099, BE-100, BE-102 (Implement Requisition History)
 * SRS Traceability: Section 6 (Requisition Module), Section 13 (Auditability), Clarification C-01
 */

import {
  createRequisition,
  getRequisitionById,
  listRequisitions,
  approveDepartmentRequisition,
  approvePAORequisition,
  rejectRequisition,
  getRequisitionHistory,
} from './requisition.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/requisitions endpoint
 */
export const create = async (req, res, next) => {
  try {
    const requesterId = req.user?.userId || req.user?.id || 'usr-uuid-requester'
    const requisition = await createRequisition({
      ...req.body,
      requesterId,
    })
    sendCreated(res, requisition)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/requisitions/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const requisition = await getRequisitionById(req.params.id)
    sendSuccess(res, requisition)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/requisitions endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listRequisitions(req.query)
    sendSuccess(res, result.requisitions, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/requisitions/:id/approve-department endpoint (BE-100)
 */
export const approveDepartment = async (req, res, next) => {
  try {
    const approverId = req.user?.userId || req.user?.id || 'usr-dept-head'
    const result = await approveDepartmentRequisition({
      id: req.params.id,
      approverId,
      lineApprovals: req.body.lineApprovals,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/requisitions/:id/approve-pao endpoint (BE-100)
 */
export const approvePAO = async (req, res, next) => {
  try {
    const paoUserId = req.user?.userId || req.user?.id || 'usr-pao-officer'
    const result = await approvePAORequisition({
      id: req.params.id,
      paoUserId,
      lineApprovals: req.body.lineApprovals,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/requisitions/:id/reject endpoint (BE-100)
 */
export const reject = async (req, res, next) => {
  try {
    const rejectedByUserId = req.user?.userId || req.user?.id || 'usr-approver'
    const result = await rejectRequisition({
      id: req.params.id,
      rejectedByUserId,
      reason: req.body.reason,
      level: req.body.level,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/requisitions/:id/history endpoint (BE-102)
 */
export const getHistory = async (req, res, next) => {
  try {
    const history = await getRequisitionHistory(req.params.id)
    sendSuccess(res, history)
  } catch (err) {
    next(err)
  }
}
