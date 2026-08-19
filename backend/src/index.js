/**
 * Backend Server Entrypoint
 * Tasks: BE-006 & BE-009 (Environment Management)
 */

import { env } from './config/env.js'
import app from './app.js'

app.listen(env.PORT, () => {
  console.log(`🚀 Stock Management System API running in [${env.NODE_ENV}] mode`)
  console.log(`📡 URL: http://localhost:${env.PORT}`)
  console.log(`🏥 Health Check Endpoint: http://localhost:${env.PORT}/api/health`)
})
