/**
 * Health Check Domain Controller
 * Tasks: BE-007, BE-010, BE-016 (API Response Standards)
 */

import { getSystemHealth } from './health.service.js'
import { sendSuccess, HTTP_STATUS } from '../../utils/response.js'

export const getHealth = async (req, res, next) => {
  try {
    const healthData = await getSystemHealth()
    const statusCode = healthData.status === 'ok' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE
    sendSuccess(res, healthData, statusCode)
  } catch (err) {
    next(err)
  }
}
