/**
 * Disposal Module End-to-End Tests
 * Tasks: BE-136, BE-137, BE-138, BE-139, BE-140, BE-141
 * SRS Traceability: Section 7.1, Section 10.1, Section 13, BR-18, FR-38, FR-39, AT-09
 */

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import disposalRoutes from '../../src/modules/disposal/disposal.routes.js'
import { errorHandler } from '../../src/middleware/error.middleware.js'
import { issueAuthToken } from '../../src/modules/auth/auth.service.js'

const app = express()
app.use(express.json())
app.use('/api/disposal-requests', disposalRoutes)
app.use(errorHandler)

describe('Disposal Module API Endpoints', () => {
  const paoToken = issueAuthToken(
    {
      userId: 'usr-pao-test',
      email: 'pao@example.com',
      role: 'PAO',
    },
    '1h'
  )

  const requesterToken = issueAuthToken(
    {
      userId: 'usr-req-test',
      email: 'requester@example.com',
      role: 'REQUESTER',
    },
    '1h'
  )

  it('POST /api/disposal-requests/:id/execute should reject unauthorized role (REQUESTER)', async () => {
    const res = await request(app)
      .post('/api/disposal-requests/test-id/execute')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        executionNotes: 'Unauthorized attempt',
      })

    expect(res.status).toBe(403)
    expect(res.body.error?.code).toBe('FORBIDDEN')
  })

  it('POST /api/disposal-requests/:id/execute should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/disposal-requests/test-id/execute')
      .send({
        executionNotes: 'Unauthenticated attempt',
      })

    expect(res.status).toBe(401)
  })

  it('POST /api/disposal-requests should validate body schema', async () => {
    const res = await request(app)
      .post('/api/disposal-requests')
      .set('Authorization', `Bearer ${paoToken}`)
      .send({
        storeId: '',
        lines: [],
      })

    expect(res.status).toBe(400)
    expect(res.body.error?.code).toBe('VALIDATION_ERROR')
  })
})
