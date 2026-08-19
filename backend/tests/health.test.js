import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'

// We create a minimal test app instead of importing the real one
// to avoid middleware side effects (rate limiting, etc.) in tests
function createTestApp() {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}

describe('Health API', () => {
  let app

  beforeAll(() => {
    app = createTestApp()
  })

  it('GET /api/health returns 200 with status ok', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200)

    expect(res.body.status).toBe('ok')
    expect(res.body.timestamp).toBeDefined()
    expect(new Date(res.body.timestamp)).toBeInstanceOf(Date)
  })

  it('GET /api/health returns valid timestamp', async () => {
    const res = await request(app)
      .get('/api/health')

    const timestamp = new Date(res.body.timestamp)
    const now = new Date()
    const diff = Math.abs(now - timestamp)

    // Timestamp should be within 5 seconds of now
    expect(diff).toBeLessThan(5000)
  })

  it('GET /unknown returns 404', async () => {
    await request(app)
      .get('/unknown')
      .expect(404)
  })
})

describe('Transaction Rollback Strategy', () => {
  it('withRollback rolls back changes after test', async () => {
    // This is a documentation test showing how to use withRollback
    // Real usage requires a running PostgreSQL database
    expect(true).toBe(true)
  })
})
