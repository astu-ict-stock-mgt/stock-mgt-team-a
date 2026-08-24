/**
 * Stock Take Controller
 * Tasks: BE-142 to BE-148
 * SRS Traceability: Section 8 (Stock Taking)
 */

import {
  createStockTake,
  getStockTakeById,
  listStockTakes,
  startStockTake,
  recordPhysicalCount,
  completeStockTake,
  reconcileStockTake,
  getVarianceSummary,
} from './stock-taking.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

export const create = async (req, res, next) => {
  try {
    const initiatedBy = req.user?.userId || req.user?.id
    const result = await createStockTake({ ...req.body, initiatedBy })
    return sendCreated(res, result)
  } catch (err) {
    return next(err)
  }
}

export const getById = async (req, res, next) => {
  try {
    const result = await getStockTakeById(req.params.id)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const list = async (req, res, next) => {
  try {
    const result = await listStockTakes(req.query)
    return sendSuccess(res, result.stockTakes, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    return next(err)
  }
}

export const start = async (req, res, next) => {
  try {
    const result = await startStockTake(req.params.id)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const recordCount = async (req, res, next) => {
  try {
    const countedBy = req.user?.userId || req.user?.id
    const result = await recordPhysicalCount({
      stockTakeId: req.params.id,
      ...req.body,
      countedBy,
    })
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const complete = async (req, res, next) => {
  try {
    const completedBy = req.user?.userId || req.user?.id
    const result = await completeStockTake(req.params.id, completedBy)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const reconcile = async (req, res, next) => {
  try {
    const reconciledBy = req.user?.userId || req.user?.id
    const result = await reconcileStockTake(req.params.id, reconciledBy)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}

export const varianceSummary = async (req, res, next) => {
  try {
    const result = await getVarianceSummary(req.params.id)
    return sendSuccess(res, result)
  } catch (err) {
    return next(err)
  }
}
