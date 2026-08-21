/**
 * Store Issue Voucher (SIV/ISIV) Controller
 * Tasks: BE-105, BE-106, BE-107 (Implement SIV/ISIV Amendment API)
 * SRS Traceability: Section 6 (Store Issue Module)
 */

import {
  createSIV,
  getSivById,
  listSivs,
  approveSIV,
  finalizeSIV,
  amendSIV,
} from './siv.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/sivs endpoint
 */
export const create = async (req, res, next) => {
  try {
    const preparedBy = req.user?.userId || req.user?.id || 'usr-storekeeper-1'
    const siv = await createSIV({
      ...req.body,
      preparedBy,
    })
    sendCreated(res, siv)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/sivs/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const siv = await getSivById(req.params.id)
    sendSuccess(res, siv)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/sivs endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listSivs(req.query)
    sendSuccess(res, result.sivs, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/sivs/:id/approve endpoint
 */
export const approve = async (req, res, next) => {
  try {
    const approverId = req.user?.userId || req.user?.id || 'usr-pao-1'
    const result = await approveSIV({
      id: req.params.id,
      approverId,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/sivs/:id/finalize endpoint
 */
export const finalize = async (req, res, next) => {
  try {
    const finalizerId = req.user?.userId || req.user?.id || 'usr-storekeeper-1'
    const result = await finalizeSIV({
      id: req.params.id,
      finalizerId,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/sivs/:id/amend endpoint (BE-107)
 */
export const amend = async (req, res, next) => {
  try {
    const result = await amendSIV({
      id: req.params.id,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
