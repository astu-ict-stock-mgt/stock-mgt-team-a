/**
 * Health Check Domain Service
 * Task: BE-007 (Establish Backend Folder/Domain Architecture)
 */

export const getSystemHealth = () => {
  return {
    status: 'ok',
    service: 'stock-management-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memoryUsage: process.memoryUsage(),
  }
}
