/**
 * Health Check Domain Service
 * Tasks: BE-007 & BE-010 (Database Health Check Integration)
 */

import { checkDatabaseHealth } from '../../config/database.js'

export const getSystemHealth = async () => {
  const dbHealth = await checkDatabaseHealth()

  return {
    status: dbHealth.isConnected ? 'ok' : 'degraded',
    service: 'stock-management-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbHealth.isConnected ? 'connected' : 'disconnected',
      latencyMs: dbHealth.latencyMs || null,
      ...(dbHealth.error && { error: dbHealth.error }),
    },
    memoryUsage: process.memoryUsage(),
  }
}
