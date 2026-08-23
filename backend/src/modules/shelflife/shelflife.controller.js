/**
 * Shelf-Life & Expiry Controller
 * Task: BE-134 (Implement Expiry/Status Rules)
 * SRS Traceability: Section 10 (Shelf-Life & Expiry Module)
 */

import {
  createBatchRecord,
  getBatchById,
  listBatches,
  getExpiringBatches,
  evaluateBatchStatuses,
} from './shelflife.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/shelflife/batches endpoint
 */
export const createBatch = async (req, res, next) => {
  try {
    const record = await createBatchRecord(req.body)
    sendCreated(res, record)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/shelflife/batches/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const record = await getBatchById(req.params.id)
    sendSuccess(res, record)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/shelflife/batches endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listBatches(req.query)
    sendSuccess(res, result.batches, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/shelflife/batches/expiring endpoint
 */
export const getExpiring = async (req, res, next) => {
  try {
    const batches = await getExpiringBatches(req.query)
    sendSuccess(res, batches)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle POST /api/shelflife/evaluate endpoint
 */
export const evaluate = async (req, res, next) => {
  try {
    const summary = await evaluateBatchStatuses()
    sendSuccess(res, summary)
  } catch (err) {
    next(err)
  }
}
