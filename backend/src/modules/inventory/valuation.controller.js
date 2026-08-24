/**
 * Inventory Valuation Controller
 * Task: BE-148 (Implement Inventory Valuation API)
 * SRS Traceability: Section 12 (Reporting & Inventory Valuation)
 */

import { getInventoryValuationReport } from './valuation.service.js'
import { sendSuccess } from '../../utils/response.js'

/**
 * Handle GET /api/inventory/valuation endpoint
 */
export const getValuationReport = async (req, res, next) => {
  try {
    const report = await getInventoryValuationReport(req.query)
    sendSuccess(res, report)
  } catch (err) {
    next(err)
  }
}
