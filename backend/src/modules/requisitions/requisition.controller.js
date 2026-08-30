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
import { ForbiddenError } from '../../utils/errors.js'

/**
 * Handle POST /api/requisitions endpoint
 */
export const create = async (req, res, next) => {
  try {
    const requesterId = req.user?.userId || req.user?.id
    if (!requesterId) {
      throw new ForbiddenError('Session expired or invalid. Please log out and log back in.')
    }
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
    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : [req.user?.roles || req.user?.role].filter(Boolean)
    if (roles.length > 0 && !roles.includes('DEPARTMENT_HEAD') && !roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Department Head or Administrator can approve requisitions at department level')
    }
    const approverId = req.user?.userId || req.user?.id
    if (!approverId) {
      throw new ForbiddenError('Session expired or invalid. Please log out and log back in.')
    }
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
    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : [req.user?.roles || req.user?.role].filter(Boolean)
    if (roles.length > 0 && !roles.includes('PAO') && !roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Property Administration Officer (PAO) or Administrator can approve requisitions at administrative level')
    }
    const paoUserId = req.user?.userId || req.user?.id
    if (!paoUserId) {
      throw new ForbiddenError('Session expired or invalid. Please log out and log back in.')
    }
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
    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : [req.user?.roles || req.user?.role].filter(Boolean)
    const level = req.body.level === 'PAO' ? 'PAO' : 'DEPARTMENT'
    if (level === 'PAO' && roles.length > 0 && !roles.includes('PAO') && !roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Property Administration Officer (PAO) or Administrator can reject requisitions at PAO level')
    }
    if (level === 'DEPARTMENT' && roles.length > 0 && !roles.includes('DEPARTMENT_HEAD') && !roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Department Head or Administrator can reject requisitions at Department level')
    }
    const rejectedByUserId = req.user?.userId || req.user?.id
    if (!rejectedByUserId) {
      throw new ForbiddenError('Session expired or invalid. Please log out and log back in.')
    }
    const result = await rejectRequisition({
      id: req.params.id,
      rejectedByUserId,
      reason: req.body.reason,
      level,
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
