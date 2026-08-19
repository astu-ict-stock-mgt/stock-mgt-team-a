/**
 * Health Check Domain Controller
 * Task: BE-007
 */

import { getSystemHealth } from './health.service.js'

export const getHealth = (req, res) => {
  const healthData = getSystemHealth()
  res.status(200).json(healthData)
}
