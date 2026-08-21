/**
 * Requisition Controller
 * Tasks: BE-098, BE-099 (Implement Requisition Create API)
 * SRS Traceability: Section 6 (Requisition Module)
 */

import {
  createRequisition,
  getRequisitionById,
  listRequisitions,
  approveDepartmentRequisition,
  approvePAORequisition,
  rejectRequisition,
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
