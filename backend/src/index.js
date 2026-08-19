/**
 * Backend Server Entrypoint
 * Task: BE-006 (Initialize Node.js/Express Backend)
 */

import app from './app.js'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Stock Management System API running at http://localhost:${PORT}`)
  console.log(`🏥 Health Check Endpoint: http://localhost:${PORT}/api/health`)
})
