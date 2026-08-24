/**
 * Shelf-Life & Expiry Controller
 * Tasks: BE-134, BE-135 (Implement Disposal Candidate Detection)
 * SRS Traceability: Section 10 (Shelf-Life & Expiry Module), Section 11 (Disposal)
 */

import {
  createBatchRecord,
  getBatchById,
  listBatches,
  getExpiringBatches,
  evaluateBatchStatuses,
  detectDisposalCandidates,
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

/**
 * Handle GET /api/shelflife/disposal-candidates endpoint (BE-135)
 */
export const getDisposalCandidates = async (req, res, next) => {
  try {
    const result = await detectDisposalCandidates(req.query)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
