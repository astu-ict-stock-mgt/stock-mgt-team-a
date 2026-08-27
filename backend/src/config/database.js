/**
 * PostgreSQL Database Connection Module (Prisma Client)
 * Task: BE-010 (Configure PostgreSQL Connection)
 * SRS Traceability: Section 9 (Architecture), NFR-04, NFR-10
 */

import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

// Singleton Prisma Client Instance
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

/**
 * Connect to PostgreSQL database and verify initial connection
 */
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL Database connected successfully')
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL Database:', error.message)
    // Note: Do not halt app in local dev if DB is not running yet during early scaffold, but flag warning
    if (env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}

/**
 * Disconnect Prisma Client gracefully
 */
export async function disconnectDB() {
  try {
    await prisma.$disconnect()
    console.log('🔌 PostgreSQL Database disconnected gracefully')
  } catch (error) {
    console.error('Error disconnecting PostgreSQL Database:', error.message)
  }
}

/**
 * Perform a fast health ping query to check database connectivity
 * @returns {Promise<{ isConnected: boolean, latencyMs?: number, error?: string }>}
 */
export async function checkDatabaseHealth() {
  const startTime = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - startTime
    return { isConnected: true, latencyMs }
  } catch (error) {
    return { isConnected: false, error: error.message || 'Database ping failed' }
  }
}
