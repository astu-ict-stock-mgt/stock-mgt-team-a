import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkHealth() {
  console.log('🩺 Initiating system diagnostic healthcheck...')
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    console.log(`✅ Database connection healthy. Roundtrip latency: ${latency}ms`)
  } catch (error) {
    console.error('❌ Database healthcheck failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkHealth()
