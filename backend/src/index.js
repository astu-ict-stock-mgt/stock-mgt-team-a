/**
 * Backend Server Entrypoint
 * Tasks: BE-006, BE-009, BE-010 (PostgreSQL Database Connection)
 */

import { env } from './config/env.js'
import { connectDB, disconnectDB } from './config/database.js'
import app from './app.js'

async function startServer() {
  // Connect to database
  await connectDB()

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Stock Management System API running in [${env.NODE_ENV}] mode`)
    console.log(`📡 URL: http://localhost:${env.PORT}`)
    console.log(`🏥 Health Check Endpoint: http://localhost:${env.PORT}/api/health`)
  })

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Closing HTTP server and database pool...`)
    server.close(async () => {
      await disconnectDB()
      console.log('Server shutdown complete.')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err)
  process.exit(1)
})
