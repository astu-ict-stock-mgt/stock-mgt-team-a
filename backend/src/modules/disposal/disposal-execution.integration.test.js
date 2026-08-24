/**
 * Disposal Execution API Integration Test Suite
 * Tasks: BE-137, BE-138, BE-139, BE-140, BE-141
 * SRS Traceability: Section 7.1, Section 13 (Security), BR-18, FR-38, FR-39, AT-09, AT-10
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import disposalRoutes from './disposal.routes.js'
import { errorHandler } from '../../middleware/error.middleware.js'
import { issueAuthToken } from '../auth/auth.service.js'
import * as disposalService from './disposal.service.js'

// Setup isolated express app for route integration testing
const app = express()
app.use(express.json())
app.use('/api/disposal-requests', disposalRoutes)
app.use(errorHandler)

describe('Disposal Execution REST API Integration Tests (BE-139)', () => {
  let paoToken
  let adminToken
  let storekeeperToken
  let requesterToken

  beforeAll(() => {
    paoToken = issueAuthToken(
      {
        userId: 'usr-pao-01',
        email: 'pao@stockmgt.gov.et',
        fullName: 'Property Admin Officer',
        role: 'PAO',
        status: 'ACTIVE',
      },
      '1h'
    )

    adminToken = issueAuthToken(
      {
        userId: 'usr-admin-01',
        email: 'admin@stockmgt.gov.et',
        fullName: 'System Administrator',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      '1h'
    )

    storekeeperToken = issueAuthToken(
      {
        userId: 'usr-storekeeper-01',
        email: 'storekeeper@stockmgt.gov.et',
        fullName: 'Main Storekeeper',
        role: 'STOREKEEPER',
        status: 'ACTIVE',
      },
      '1h'
    )

    requesterToken = issueAuthToken(
      {
        userId: 'usr-requester-01',
        email: 'requester@stockmgt.gov.et',
        fullName: 'Department Requester',
        role: 'REQUESTER',
        status: 'ACTIVE',
      },
      '1h'
    )
  })

  describe('POST /api/disposal-requests (BE-137)', () => {
    it('should return 401 Unauthorized if no token provided', async () => {
      const res = await request(app)
        .post('/api/disposal-requests')
        .send({
          storeId: 'store-1',
          reason: 'Damaged items',
          lines: [{ itemId: 'item-1', quantity: 5 }],
        })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should return 400 Validation Error if input is invalid (empty lines)', async () => {
      const res = await request(app)
        .post('/api/disposal-requests')
        .set('Authorization', `Bearer ${paoToken}`)
        .send({
          storeId: 'store-1',
          reason: 'Damaged items',
          lines: [],
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/disposal-requests/:id/execute (BE-139)', () => {
    it('should return 401 Unauthorized if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/disposal-requests/disp-123/execute')
        .send({
          executionNotes: 'Destroyed',
        })

      expect(res.status).toBe(401)
    })

    it('should return 403 Forbidden if user lacks disposal:execute permission (e.g. REQUESTER)', async () => {
      const res = await request(app)
        .post('/api/disposal-requests/disp-123/execute')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          executionNotes: 'Destroyed',
        })

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.error?.code).toBe('FORBIDDEN')
    })

    it('should execute disposal successfully with PAO role (200 OK)', async () => {
      const mockExecuted = {
        id: 'disp-123',
        requestNumber: 'DISP-2026-00001',
        status: 'EXECUTED',
        disposalMethod: 'WRITE_OFF',
        reason: 'Expired chemical stock',
        executedBy: 'usr-pao-01',
        executedAt: new Date().toISOString(),
        witnessName: 'Inspector Gadget',
        certificateNumber: 'CERT-001',
        disposalLocation: 'Facility Zone B',
        lines: [
          {
            id: 'line-1',
            itemId: 'item-1',
            quantity: 5,
            status: 'EXECUTED',
          },
        ],
      }

      vi.spyOn(disposalService, 'executeDisposal').mockResolvedValue(mockExecuted)

      const res = await request(app)
        .post('/api/disposal-requests/disp-123/execute')
        .set('Authorization', `Bearer ${paoToken}`)
        .send({
          executionNotes: 'Safely incinerated in certified facility',
          witnessName: 'Inspector Gadget',
          certificateNumber: 'CERT-001',
          disposalLocation: 'Facility Zone B',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data?.status).toBe('EXECUTED')
      expect(res.body.data?.certificateNumber).toBe('CERT-001')
    })
  })

  describe('PATCH /api/disposal-requests/:id/approve (BE-138)', () => {
    it('should return 403 Forbidden for REQUESTER role', async () => {
      const res = await request(app)
        .patch('/api/disposal-requests/disp-123/approve')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ approvalNotes: 'Looks good' })

      expect(res.status).toBe(403)
    })

    it('should approve disposal request for PAO role', async () => {
      const mockApproved = {
        id: 'disp-123',
        status: 'APPROVED',
        approvedBy: 'usr-pao-01',
        approvalNotes: 'Authorized for auction',
        disposalMethod: 'AUCTION',
      }

      vi.spyOn(disposalService, 'approveDisposalRequest').mockResolvedValue(mockApproved)

      const res = await request(app)
        .patch('/api/disposal-requests/disp-123/approve')
        .set('Authorization', `Bearer ${paoToken}`)
        .send({
          approvalNotes: 'Authorized for auction',
          disposalMethod: 'AUCTION',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data?.status).toBe('APPROVED')
    })
  })

  describe('GET /api/disposal-requests/:id/history (BE-140)', () => {
    it('should return audit history timeline', async () => {
      const mockHistory = {
        summary: {
          disposalId: 'disp-123',
          requestNumber: 'DISP-2026-00001',
          currentStatus: 'EXECUTED',
          totalItemsDisposed: 5,
        },
        events: [
          { eventType: 'DISPOSAL_REQUEST_CREATED', status: 'DRAFT' },
          { eventType: 'DISPOSAL_REQUEST_APPROVED', status: 'APPROVED' },
          { eventType: 'DISPOSAL_EXECUTED_AND_STOCK_DEDUCTED', status: 'EXECUTED' },
        ],
        transactions: [],
        lines: [],
      }

      vi.spyOn(disposalService, 'getDisposalAuditHistory').mockResolvedValue(mockHistory)

      const res = await request(app)
        .get('/api/disposal-requests/disp-123/history')
        .set('Authorization', `Bearer ${paoToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data?.events.length).toBe(3)
    })
  })
})
