/**
 * Environment Configuration & Validation Module
 * Task: BE-009 (Configure Environment Management)
 * SRS Traceability: Section 13 (Security), NFR-04, NFR-05
 */

import dotenv from 'dotenv'

// Determine environment
const nodeEnv = process.env.NODE_ENV || 'development'

// Load specific .env file based on environment
const envFile = `.env.${nodeEnv}`
dotenv.config({ path: envFile })
// Also fallback to root .env
dotenv.config()

/**
 * Validate environment configuration against required schema rules.
 * Refuses server startup if critical configuration is missing or invalid.
 */
function validateEnv() {
  const errors = []

  const allowedEnvs = ['development', 'test', 'production']
  if (!allowedEnvs.includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${allowedEnvs.join(', ')}. Got: '${nodeEnv}'`)
  }

  const portStr = process.env.PORT || '3001'
  const portNum = parseInt(portStr, 10)
  if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
    errors.push(`PORT must be a valid integer between 1024 and 65535. Got: '${portStr}'`)
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required (e.g. postgresql://user:pass@localhost:5432/sms_db)')
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    errors.push('JWT_SECRET is required and must be at least 16 characters long')
  }

  if (errors.length > 0) {
    console.error('\n❌ ENVIRONMENT CONFIGURATION ERROR(S):')
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`))
    console.error('\nApp refusing to boot due to missing or invalid environment variables (BE-009).\n')
    process.exit(1)
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: portNum,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  }
}

export const env = validateEnv()
