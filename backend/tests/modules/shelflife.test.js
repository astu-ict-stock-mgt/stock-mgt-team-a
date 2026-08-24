/**
 * Shelf-Life & Expiry Monitoring Unit Tests
 * Tasks: BE-132 (Shelf-Life Schema) & BE-133 (Shelf-Life Monitoring Service)
 * SRS Traceability: Section 10.1 (Core Entities: shelflife_records),
 *                   FR-37 (perishable item expiry monitoring & alerts),
 *                   Clarification C-12 (per-batch expiry tracking: HEALTHY, NEAR_EXPIRY, EXPIRED),
 *                   Appendix C (SHELFLIFE_READ permission)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShelfLifeService } from '../../src/modules/shelflife/shelflife.service.js'
import {
  ShelfLifeStatusEnum,
  recordBatchSchema,
  queryBatchesSchema,
} from '../../src/modules/shelflife/dto/shelflife.dto.js'
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../src/utils/errors.js'

describe('BE-133: Shelf-Life Monitoring Service Tests', () => {
  const baseDate = new Date('2026-08-23T12:00:00.000Z')

  describe('DTO & Enum Validation', () => {
    it('validates ShelfLifeStatusEnum values', () => {
      expect(ShelfLifeStatusEnum.options).toEqual(['HEALTHY', 'NEAR_EXPIRY', 'EXPIRED'])
    })

    it('validates a valid batch creation payload', () => {
      const payload = {
        itemId: '550e8400-e29b-41d4-a716-446655440001',
        batchNumber: 'BATCH-2026-001',
        quantity: 150,
        expiryDate: '2026-12-31T00:00:00.000Z',
        alertDaysBeforeExpiry: 45,
        storeId: '550e8400-e29b-41d4-a716-446655440002',
        notes: 'Cold-chain storage required',
      }

      const result = recordBatchSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.batchNumber).toBe('BATCH-2026-001')
        expect(result.data.alertDaysBeforeExpiry).toBe(45)
      }
    })

    it('rejects batch payload with negative quantity', () => {
      const payload = {
        itemId: 'item-1',
        batchNumber: 'BATCH-001',
        quantity: -10,
        expiryDate: '2026-12-31',
      }
      expect(recordBatchSchema.safeParse(payload).success).toBe(false)
    })

    it('rejects batch payload with empty batchNumber or itemId', () => {
      expect(recordBatchSchema.safeParse({ itemId: '', batchNumber: 'B1', quantity: 10, expiryDate: '2026-12-31' }).success).toBe(false)
      expect(recordBatchSchema.safeParse({ itemId: 'item-1', batchNumber: '', quantity: 10, expiryDate: '2026-12-31' }).success).toBe(false)
    })

    it('applies default values for queryBatchesSchema', () => {
      const query = queryBatchesSchema.parse({})
      expect(query.limit).toBe(50)
      expect(query.offset).toBe(0)
    })
  })

  describe('Pure Status Calculation (ShelfLifeService.calculateStatus)', () => {
    it('evaluates HEALTHY status when days remaining exceed alert threshold', () => {
      const expiry = new Date('2026-11-23T12:00:00.000Z') // ~92 days later
      const result = ShelfLifeService.calculateStatus(expiry, 30, baseDate)

      expect(result.status).toBe('HEALTHY')
      expect(result.daysUntilExpiry).toBeGreaterThan(30)
      expect(result.isExpired).toBe(false)
      expect(result.isNearExpiry).toBe(false)
    })

    it('evaluates NEAR_EXPIRY status when days remaining are within alert threshold', () => {
      const expiry = new Date('2026-09-10T12:00:00.000Z') // ~18 days later
      const result = ShelfLifeService.calculateStatus(expiry, 30, baseDate)

      expect(result.status).toBe('NEAR_EXPIRY')
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(30)
      expect(result.daysUntilExpiry).toBeGreaterThanOrEqual(0)
      expect(result.isExpired).toBe(false)
      expect(result.isNearExpiry).toBe(true)
    })

    it('evaluates NEAR_EXPIRY on the exact threshold day boundary', () => {
      const expiry = new Date('2026-09-22T12:00:00.000Z') // exactly 30 days
      const result = ShelfLifeService.calculateStatus(expiry, 30, baseDate)

      expect(result.status).toBe('NEAR_EXPIRY')
      expect(result.daysUntilExpiry).toBe(30)
      expect(result.isNearExpiry).toBe(true)
    })

    it('evaluates NEAR_EXPIRY when expiring today (day 0)', () => {
      const expiry = new Date('2026-08-23T12:00:00.000Z') // same day
      const result = ShelfLifeService.calculateStatus(expiry, 30, baseDate)

      expect(result.status).toBe('NEAR_EXPIRY')
      expect(result.daysUntilExpiry).toBe(0)
      expect(result.isExpired).toBe(false)
      expect(result.isNearExpiry).toBe(true)
    })

    it('evaluates EXPIRED status when expiry date is in the past', () => {
      const expiry = new Date('2026-08-20T12:00:00.000Z') // 3 days ago
      const result = ShelfLifeService.calculateStatus(expiry, 30, baseDate)

      expect(result.status).toBe('EXPIRED')
      expect(result.daysUntilExpiry).toBeLessThan(0)
      expect(result.isExpired).toBe(true)
      expect(result.isNearExpiry).toBe(false)
    })

    it('handles custom alert days threshold correctly', () => {
      const expiry = new Date('2026-10-10T12:00:00.000Z') // ~48 days later

      // With 30-day threshold -> HEALTHY
      expect(ShelfLifeService.calculateStatus(expiry, 30, baseDate).status).toBe('HEALTHY')

      // With 60-day threshold -> NEAR_EXPIRY
      expect(ShelfLifeService.calculateStatus(expiry, 60, baseDate).status).toBe('NEAR_EXPIRY')
    })
  })

  describe('Batch Registration (recordBatch)', () => {
    it('successfully registers a new batch with enriched status metadata', async () => {
      const mockItem = { id: 'item-1', code: 'MED-01', name: 'Antiseptic Solution' }
      const futureExpiry = new Date('2026-12-31T00:00:00.000Z')

      const mockDb = {
        item: {
          findUnique: vi.fn().mockResolvedValue(mockItem),
        },
        shelfLifeRecord: {
          findUnique: vi.fn().mockResolvedValue(null), // no duplicate
          create: vi.fn().mockImplementation(({ data }) =>
            Promise.resolve({
              id: 'record-uuid-1',
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
              item: mockItem,
              store: { id: 'store-1', code: 'STORE-MAIN-01', name: 'Main Store' },
              location: null,
            })
          ),
        },
      }

      const result = await ShelfLifeService.recordBatch(
        {
          itemId: 'item-1',
          batchNumber: 'BATCH-2026-X1',
          quantity: 200,
          expiryDate: futureExpiry,
          alertDaysBeforeExpiry: 30,
          storeId: 'store-1',
        },
        mockDb
      )

      expect(result.id).toBe('record-uuid-1')
      expect(result.batchNumber).toBe('BATCH-2026-X1')
      expect(result.quantity).toBe(200)
      expect(result.currentStatus).toBeDefined()
      expect(result.daysUntilExpiry).toBeDefined()
      expect(mockDb.shelfLifeRecord.create).toHaveBeenCalled()
    })

    it('throws NotFoundError if item does not exist', async () => {
      const mockDb = {
        item: { findUnique: vi.fn().mockResolvedValue(null) },
      }

      await expect(
        ShelfLifeService.recordBatch(
          {
            itemId: 'non-existent-item',
            batchNumber: 'BATCH-001',
            quantity: 50,
            expiryDate: new Date('2026-12-31'),
          },
          mockDb
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError if batch number is already registered for this item', async () => {
      const mockItem = { id: 'item-1', code: 'MED-01', name: 'Antiseptic Solution' }
      const mockDb = {
        item: { findUnique: vi.fn().mockResolvedValue(mockItem) },
        shelfLifeRecord: {
          findUnique: vi.fn().mockResolvedValue({ id: 'existing-rec', batchNumber: 'BATCH-DUP' }),
        },
      }

      await expect(
        ShelfLifeService.recordBatch(
          {
            itemId: 'item-1',
            batchNumber: 'BATCH-DUP',
            quantity: 50,
            expiryDate: new Date('2026-12-31'),
          },
          mockDb
        )
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('Batch Query & Filtering (getBatches & getBatchById)', () => {
    it('retrieves and enriches paginated batches with search and filters', async () => {
      const rawRecords = [
        {
          id: 'rec-1',
          itemId: 'item-1',
          batchNumber: 'BATCH-HEALTHY-01',
          quantity: 100,
          expiryDate: new Date('2026-12-31'),
          alertDaysBeforeExpiry: 30,
          status: 'HEALTHY',
          item: { id: 'item-1', code: 'MED-01', name: 'Antiseptic' },
          store: { id: 'store-1', code: 'STORE-01', name: 'Central' },
          location: null,
        },
        {
          id: 'rec-2',
          itemId: 'item-2',
          batchNumber: 'BATCH-EXPIRED-02',
          quantity: 15,
          expiryDate: new Date('2026-08-01'),
          alertDaysBeforeExpiry: 30,
          status: 'EXPIRED',
          item: { id: 'item-2', code: 'REAG-02', name: 'Lab Reagent' },
          store: { id: 'store-1', code: 'STORE-01', name: 'Central' },
          location: null,
        },
      ]

      const mockDb = {
        shelfLifeRecord: {
          findMany: vi.fn().mockResolvedValue(rawRecords),
          count: vi.fn().mockResolvedValue(2),
        },
      }

      const result = await ShelfLifeService.getBatches(
        { storeId: 'store-1', limit: 10, offset: 0 },
        mockDb
      )

      expect(result.total).toBe(2)
      expect(result.records).toHaveLength(2)
      expect(result.records[0].currentStatus).toBeDefined()
      expect(result.records[0].daysUntilExpiry).toBeDefined()
      expect(result.records[1].isExpired).toBe(true)
    })

    it('retrieves a single batch by ID and throws NotFoundError for invalid ID', async () => {
      const mockRecord = {
        id: 'rec-1',
        batchNumber: 'BATCH-001',
        quantity: 50,
        expiryDate: new Date('2026-12-31'),
        alertDaysBeforeExpiry: 30,
        item: { code: 'ITM-01', name: 'Item 1' },
      }

      const mockDb = {
        shelfLifeRecord: {
          findUnique: vi.fn().mockImplementation(({ where }) =>
            where.id === 'rec-1' ? Promise.resolve(mockRecord) : Promise.resolve(null)
          ),
        },
      }

      const found = await ShelfLifeService.getBatchById('rec-1', mockDb)
      expect(found.id).toBe('rec-1')
      expect(found.daysUntilExpiry).toBeDefined()

      await expect(ShelfLifeService.getBatchById('rec-missing', mockDb)).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('Alerts & Expiry Monitoring (getExpiringBatches & getExpiredBatches)', () => {
    it('retrieves expiring batches within alert window sorted ascending', async () => {
      const expiringRecords = [
        {
          id: 'rec-1',
          batchNumber: 'BATCH-NEAR-1',
          quantity: 20,
          expiryDate: new Date(Date.now() + 5 * 86400000), // 5 days
          alertDaysBeforeExpiry: 30,
          item: { code: 'ITM-01', name: 'Vaccine Batch 1' },
        },
        {
          id: 'rec-2',
          batchNumber: 'BATCH-NEAR-2',
          quantity: 40,
          expiryDate: new Date(Date.now() + 20 * 86400000), // 20 days
          alertDaysBeforeExpiry: 30,
          item: { code: 'ITM-02', name: 'Vaccine Batch 2' },
        },
      ]

      const mockDb = {
        shelfLifeRecord: {
          findMany: vi.fn().mockResolvedValue(expiringRecords),
        },
      }

      const results = await ShelfLifeService.getExpiringBatches('store-1', 30, mockDb)
      expect(results).toHaveLength(2)
      expect(results[0].isNearExpiry).toBe(true)
      expect(results[1].isNearExpiry).toBe(true)
    })

    it('retrieves expired batches for quarantine and reporting', async () => {
      const expiredRecords = [
        {
          id: 'rec-exp-1',
          batchNumber: 'BATCH-EXPIRED-99',
          quantity: 12,
          expiryDate: new Date('2026-08-01'),
          alertDaysBeforeExpiry: 30,
          item: { code: 'EXP-01', name: 'Chemical Reagent' },
        },
      ]

      const mockDb = {
        shelfLifeRecord: {
          findMany: vi.fn().mockResolvedValue(expiredRecords),
        },
      }

      const results = await ShelfLifeService.getExpiredBatches('store-1', mockDb)
      expect(results).toHaveLength(1)
      expect(results[0].isExpired).toBe(true)
    })
  })

  describe('Dashboard Summaries & Metrics (getDashboardSummary)', () => {
    it('aggregates total units, health breakdown, and critical batch list', async () => {
      const mockBatches = [
        {
          id: 'b-1',
          quantity: 100,
          expiryDate: new Date(Date.now() + 90 * 86400000), // Healthy
          alertDaysBeforeExpiry: 30,
          status: 'HEALTHY',
          item: { code: 'A', name: 'A' },
        },
        {
          id: 'b-2',
          quantity: 30,
          expiryDate: new Date(Date.now() + 10 * 86400000), // Near expiry
          alertDaysBeforeExpiry: 30,
          status: 'NEAR_EXPIRY',
          item: { code: 'B', name: 'B' },
        },
        {
          id: 'b-3',
          quantity: 20,
          expiryDate: new Date(Date.now() - 5 * 86400000), // Expired
          alertDaysBeforeExpiry: 30,
          status: 'EXPIRED',
          item: { code: 'C', name: 'C' },
        },
      ]

      const mockDb = {
        shelfLifeRecord: {
          findMany: vi.fn().mockResolvedValue(mockBatches),
        },
      }

      const summary = await ShelfLifeService.getDashboardSummary('store-1', mockDb)

      expect(summary.totalBatches).toBe(3)
      expect(summary.totalQuantity).toBe(150)
      expect(summary.healthy.count).toBe(1)
      expect(summary.healthy.quantity).toBe(100)
      expect(summary.nearExpiry.count).toBe(1)
      expect(summary.nearExpiry.quantity).toBe(30)
      expect(summary.expired.count).toBe(1)
      expect(summary.expired.quantity).toBe(20)
      expect(summary.criticalBatches).toHaveLength(2) // near expiry + expired
    })
  })

  describe('Disposal Candidate Detection (getDisposalCandidates)', () => {
    it('identifies expired batches as disposal candidates with recommended action', async () => {
      const mockCandidates = [
        {
          id: 'b-exp',
          batchNumber: 'BATCH-OBS-01',
          quantity: 25,
          expiryDate: new Date('2026-08-01'),
          alertDaysBeforeExpiry: 30,
          item: { code: 'MAT-01', name: 'Latex Gloves' },
        },
      ]

      const mockDb = {
        shelfLifeRecord: {
          findMany: vi.fn().mockResolvedValue(mockCandidates),
        },
      }

      const candidates = await ShelfLifeService.getDisposalCandidates('store-1', mockDb)

      expect(candidates).toHaveLength(1)
      expect(candidates[0].isExpired).toBe(true)
      expect(candidates[0].candidateReason).toBe('EXPIRED_SHELF_LIFE')
      expect(candidates[0].recommendedAction).toBe('DISPOSAL_REQUEST')
    })
  })

  describe('Quantity Adjustments (updateBatchQuantity)', () => {
    it('increments batch quantity successfully', async () => {
      const existing = { id: 'rec-1', quantity: 50, expiryDate: new Date('2026-12-31') }
      const mockDb = {
        shelfLifeRecord: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockImplementation(({ data }) =>
            Promise.resolve({ ...existing, quantity: data.quantity })
          ),
        },
      }

      const updated = await ShelfLifeService.updateBatchQuantity('rec-1', 25, mockDb)
      expect(updated.quantity).toBe(75)
    })

    it('decrements batch quantity successfully when sufficient quantity exists', async () => {
      const existing = { id: 'rec-1', quantity: 50, expiryDate: new Date('2026-12-31') }
      const mockDb = {
        shelfLifeRecord: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockImplementation(({ data }) =>
            Promise.resolve({ ...existing, quantity: data.quantity })
          ),
        },
      }

      const updated = await ShelfLifeService.updateBatchQuantity('rec-1', -30, mockDb)
      expect(updated.quantity).toBe(20)
    })

    it('throws ValidationError if requested deduction causes negative quantity', async () => {
      const existing = { id: 'rec-1', quantity: 10, expiryDate: new Date('2026-12-31') }
      const mockDb = {
        shelfLifeRecord: {
          findUnique: vi.fn().mockResolvedValue(existing),
        },
      }

      await expect(
        ShelfLifeService.updateBatchQuantity('rec-1', -15, mockDb)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('Batch Status Synchronization (refreshBatchStatuses)', () => {
    it('syncs database status values when calendar dates shift across boundaries', async () => {
      const outOfSyncRecords = [
        {
          id: 'rec-was-healthy-now-near',
          expiryDate: new Date('2026-09-05T00:00:00.000Z'), // ~13 days from baseDate
          alertDaysBeforeExpiry: 30,
          status: 'HEALTHY', // database says healthy, but date says near expiry
        },
        {
          id: 'rec-already-synced',
          expiryDate: new Date('2026-12-31T00:00:00.000Z'),
          alertDaysBeforeExpiry: 30,
          status: 'HEALTHY',
        },
      ]

      const mockDb = {
        shelfLifeRecord: {
          findMany: vi.fn().mockResolvedValue(outOfSyncRecords),
          update: vi.fn().mockResolvedValue({}),
        },
      }

      const result = await ShelfLifeService.refreshBatchStatuses('store-1', baseDate, mockDb)
      expect(result.updatedCount).toBe(1)
      expect(mockDb.shelfLifeRecord.update).toHaveBeenCalledWith({
        where: { id: 'rec-was-healthy-now-near' },
        data: { status: 'NEAR_EXPIRY' },
      })
    })
  })
})
