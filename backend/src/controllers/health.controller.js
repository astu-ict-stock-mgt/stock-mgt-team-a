/**
 * Health Check Controller
 * Task: BE-006 (Initialize Node.js/Express Backend)
 */

export const getHealth = (req, res) => {
  const healthData = {
    status: 'ok',
    service: 'stock-management-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }
  res.status(200).json(healthData)
}
