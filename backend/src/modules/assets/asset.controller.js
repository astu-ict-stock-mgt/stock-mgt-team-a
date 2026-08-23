/**
 * Fixed Asset Controller
 * Tasks: BE-130, BE-131 (Implement Asset Lifecycle API)
 * SRS Traceability: Section 9 (Fixed Assets Register)
 */

import {
  createAsset,
  getAssetById,
  listAssets,
  assignCustody,
  updateAssetStatus,
} from './asset.service.js'
import { sendCreated, sendSuccess } from '../../utils/response.js'

/**
 * Handle POST /api/assets endpoint
 */
export const create = async (req, res, next) => {
  try {
    const asset = await createAsset(req.body)
    sendCreated(res, asset)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/assets/:id endpoint
 */
export const getById = async (req, res, next) => {
  try {
    const asset = await getAssetById(req.params.id)
    sendSuccess(res, asset)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle GET /api/assets endpoint
 */
export const list = async (req, res, next) => {
  try {
    const result = await listAssets(req.query)
    sendSuccess(res, result.assets, 200, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/assets/:id/custody endpoint
 */
export const updateCustody = async (req, res, next) => {
  try {
    const result = await assignCustody({
      id: req.params.id,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle PATCH /api/assets/:id/status endpoint
 */
export const updateStatus = async (req, res, next) => {
  try {
    const result = await updateAssetStatus({
      id: req.params.id,
      ...req.body,
    })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
