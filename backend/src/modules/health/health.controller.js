/**
 * Health Check Domain Controller
 * Tasks: BE-007 & BE-010
 */

import { getSystemHealth } from './health.service.js'

export const getHealth = async (req, res, next) => {
  try {
    const healthData = await getSystemHealth()
    const statusCode = healthData.status === 'ok' ? 200 : 503
    res.status(statusCode).json(healthData)
  } catch (err) {
    next(err)
  }
}
