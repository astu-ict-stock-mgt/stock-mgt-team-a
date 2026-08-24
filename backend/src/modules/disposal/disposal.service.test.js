/**
 * Disposal Execution Service Unit Tests
 * Tasks: BE-136, BE-137, BE-138, BE-139, BE-140
 * SRS Traceability: Section 7.1 (Disposal State Model), Section 10.1, Section 13 (Auditability),
 *                   BR-18 (Disposal Policy), FR-38, FR-39, AT-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateDisposalNumber,
  createDisposalRequest,
  getDisposalById,
  approveDisposalRequest,
  rejectDisposalRequest,
  executeDisposal,
  getDisposalAuditHistory,
} from './disposal.service.js'
import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

// Mock prisma client methods for unit testing
vi.mock('../../config/database.js', () => {
  return {
    prisma: {
      disposalRequest: {
        count: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      disposalRequestLine: {
        update: vi.fn(),
      },
      store: {
        findUnique: vi.fn(),
      },
      item: {
        findUnique: vi.fn(),
      },
      stockCard: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockCardTransaction: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      binCard: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      binTransaction: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb(prisma)
      }),
    },
  }
})

describe('Disposal Execution Service (BE-139)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateDisposalNumber', () => {
    it('should generate formatted sequential disposal number DISP-YYYY-XXXXX', async () => {
      prisma.disposalRequest.count.mockResolvedValue(4)
      const currentYear = new Date().getFullYear()

      const result = await generateDisposalNumber()
      expect(result).toBe(`DISP-${currentYear}-00005`)
    })
  })

  describe('createDisposalRequest', () => {
    it('should throw ValidationError if required fields are missing', async () => {
      await expect(
        createDisposalRequest({ storeId: '', requesterId: 'usr-1', reason: 'Damaged' })
      ).rejects.toThrow(ValidationError)

      await expect(
        createDisposalRequest({ storeId: 'store-1', requesterId: '', reason: 'Damaged' })
      ).rejects.toThrow(ValidationError)

      await expect(
        createDisposalRequest({ storeId: 'store-1', requesterId: 'usr-1', reason: '' })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if lines array is empty', async () => {
      await expect(
        createDisposalRequest({
          storeId: 'store-1',
          requesterId: 'usr-1',
          reason: 'Damaged',
          lines: [],
        })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if store does not exist', async () => {
      prisma.store.findUnique.mockResolvedValue(null)

      await expect(
        createDisposalRequest({
          storeId: 'invalid-store',
          requesterId: 'usr-1',
          reason: 'Damaged',
          lines: [{ itemId: 'item-1', quantity: 5 }],
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError if item does not exist', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 'store-1', name: 'Main Store' })
      prisma.item.findUnique.mockResolvedValue(null)

      await expect(
        createDisposalRequest({
          storeId: 'store-1',
          requesterId: 'usr-1',
          reason: 'Damaged',
          lines: [{ itemId: 'invalid-item', quantity: 5 }],
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('should create a disposal request in DRAFT status with computed totals', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 'store-1', name: 'Main Store' })
      prisma.item.findUnique.mockResolvedValue({ id: 'item-1', name: 'Item 1' })
      prisma.disposalRequest.count.mockResolvedValue(0)

      const mockCreated = {
        id: 'disp-1',
        requestNumber: `DISP-${new Date().getFullYear()}-00001`,
        storeId: 'store-1',
        requesterId: 'usr-1',
        status: 'DRAFT',
        disposalMethod: 'WRITE_OFF',
        reason: 'Expired reagents',
        totalEstimatedValue: 500,
        lines: [
          {
            id: 'line-1',
            itemId: 'item-1',
            quantity: 5,
            unitCost: 100,
            totalCost: 500,
            status: 'PENDING',
          },
        ],
      }

      prisma.disposalRequest.create.mockResolvedValue(mockCreated)

      const result = await createDisposalRequest({
        storeId: 'store-1',
        requesterId: 'usr-1',
        reason: 'Expired reagents',
        lines: [{ itemId: 'item-1', quantity: 5, unitCost: 100 }],
      })

      expect(result.id).toBe('disp-1')
      expect(result.status).toBe('DRAFT')
      expect(result.totalEstimatedValue).toBe(500)
      expect(prisma.disposalRequest.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('approveDisposalRequest (BE-138)', () => {
    it('should throw ConflictError if request is already approved or executed', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'EXECUTED',
      })

      await expect(
        approveDisposalRequest({
          id: 'disp-1',
          approverId: 'usr-pao',
          approvalNotes: 'Approved for destruction',
        })
      ).rejects.toThrow(ConflictError)
    })

    it('should approve a DRAFT disposal request', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'DRAFT',
      })

      prisma.disposalRequest.update.mockResolvedValue({
        id: 'disp-1',
        status: 'APPROVED',
        approvedBy: 'usr-pao',
        approvalNotes: 'Approved for destruction',
      })

      const result = await approveDisposalRequest({
        id: 'disp-1',
        approverId: 'usr-pao',
        approvalNotes: 'Approved for destruction',
      })

      expect(result.status).toBe('APPROVED')
      expect(prisma.disposalRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'disp-1' },
          data: expect.objectContaining({
            status: 'APPROVED',
            approvedBy: 'usr-pao',
          }),
        })
      )
    })
  })

  describe('rejectDisposalRequest (BE-138)', () => {
    it('should throw ValidationError if rejection reason is missing', async () => {
      await expect(
        rejectDisposalRequest({
          id: 'disp-1',
          rejectedById: 'usr-pao',
          rejectionReason: '',
        })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ConflictError if request is already executed', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'EXECUTED',
      })

      await expect(
        rejectDisposalRequest({
          id: 'disp-1',
          rejectedById: 'usr-pao',
          rejectionReason: 'Items still needed',
        })
      ).rejects.toThrow(ConflictError)
    })

    it('should reject a disposal request with reason', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'DRAFT',
      })

      prisma.disposalRequest.update.mockResolvedValue({
        id: 'disp-1',
        status: 'REJECTED',
        rejectionReason: 'Items still usable',
      })

      const result = await rejectDisposalRequest({
        id: 'disp-1',
        rejectedById: 'usr-pao',
        rejectionReason: 'Items still usable',
      })

      expect(result.status).toBe('REJECTED')
      expect(result.rejectionReason).toBe('Items still usable')
    })
  })

  describe('executeDisposal (BE-139)', () => {
    it('should throw ConflictError if request is already EXECUTED (idempotency check)', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'EXECUTED',
        lines: [{ itemId: 'item-1', quantity: 5 }],
      })

      await expect(
        executeDisposal({
          id: 'disp-1',
          executedBy: 'usr-pao',
        })
      ).rejects.toThrow(ConflictError)
    })

    it('should throw ConflictError if request is not in APPROVED status (e.g. DRAFT)', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'DRAFT',
        lines: [{ itemId: 'item-1', quantity: 5 }],
      })

      await expect(
        executeDisposal({
          id: 'disp-1',
          executedBy: 'usr-pao',
        })
      ).rejects.toThrow(ConflictError)
    })

    it('should throw ConflictError if stock card is missing or insufficient stock', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        requestNumber: 'DISP-2026-00001',
        storeId: 'store-1',
        status: 'APPROVED',
        lines: [
          {
            id: 'line-1',
            itemId: 'item-1',
            quantity: 10,
            item: { name: 'Item 1' },
          },
        ],
      })

      // Stock card only has 3 available
      prisma.stockCard.findUnique.mockResolvedValue({
        id: 'sc-1',
        itemId: 'item-1',
        storeId: 'store-1',
        quantity: 3,
        availableQty: 3,
      })

      await expect(
        executeDisposal({
          id: 'disp-1',
          executedBy: 'usr-pao',
        })
      ).rejects.toThrow(/Insufficient stock available/)
    })

    it('should successfully execute disposal, decrement stock balances, create DISPOSAL transactions and mark status EXECUTED', async () => {
      const mockDisposal = {
        id: 'disp-1',
        requestNumber: 'DISP-2026-00001',
        storeId: 'store-1',
        requesterId: 'usr-requester',
        status: 'APPROVED',
        disposalMethod: 'DESTRUCTION',
        lines: [
          {
            id: 'line-1',
            itemId: 'item-1',
            locationId: 'loc-1',
            quantity: 5,
            item: { name: 'Reagent A' },
          },
        ],
      }

      prisma.disposalRequest.findUnique.mockResolvedValue(mockDisposal)

      // Stock Card has 20 available
      prisma.stockCard.findUnique.mockResolvedValue({
        id: 'sc-1',
        itemId: 'item-1',
        storeId: 'store-1',
        quantity: 20,
        availableQty: 20,
      })

      // Bin Card has 20
      prisma.binCard.findUnique.mockResolvedValue({
        id: 'bin-1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 20,
      })

      const mockExecutedRecord = {
        ...mockDisposal,
        status: 'EXECUTED',
        executedBy: 'usr-pao',
        executedAt: new Date(),
        witnessName: 'Witness Officer',
        certificateNumber: 'CERT-DISP-001',
        disposalLocation: 'Main Incinerator',
      }

      prisma.disposalRequest.update.mockResolvedValue(mockExecutedRecord)

      const result = await executeDisposal({
        id: 'disp-1',
        executedBy: 'usr-pao',
        executionNotes: 'Incinerated under environmental guidelines',
        witnessName: 'Witness Officer',
        certificateNumber: 'CERT-DISP-001',
        disposalLocation: 'Main Incinerator',
      })

      expect(result.status).toBe('EXECUTED')

      // 1. Verify Stock Card updated (20 - 5 = 15)
      expect(prisma.stockCard.update).toHaveBeenCalledWith({
        where: { id: 'sc-1' },
        data: expect.objectContaining({
          quantity: 15,
          availableQty: 15,
        }),
      })

      // 2. Verify Stock Card Transaction created
      expect(prisma.stockCardTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stockCardId: 'sc-1',
          transactionType: 'DISPOSAL',
          quantity: -5,
          referenceType: 'DISPOSAL_REQUEST',
          referenceId: 'disp-1',
          referenceNumber: 'DISP-2026-00001',
          createdBy: 'usr-pao',
        }),
      })

      // 3. Verify Bin Card updated (20 - 5 = 15)
      expect(prisma.binCard.update).toHaveBeenCalledWith({
        where: { id: 'bin-1' },
        data: expect.objectContaining({
          quantity: 15,
        }),
      })

      // 4. Verify Bin Transaction created
      expect(prisma.binTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          binCardId: 'bin-1',
          transactionType: 'DISPOSAL',
          quantity: -5,
          referenceType: 'DISPOSAL_REQUEST',
          referenceId: 'disp-1',
          referenceNumber: 'DISP-2026-00001',
          createdBy: 'usr-pao',
        }),
      })

      // 5. Verify Line Item updated to EXECUTED
      expect(prisma.disposalRequestLine.update).toHaveBeenCalledWith({
        where: { id: 'line-1' },
        data: { status: 'EXECUTED' },
      })

      // 6. Verify Disposal Request header updated to EXECUTED
      expect(prisma.disposalRequest.update).toHaveBeenCalledWith({
        where: { id: 'disp-1' },
        data: expect.objectContaining({
          status: 'EXECUTED',
          executedBy: 'usr-pao',
          witnessName: 'Witness Officer',
          certificateNumber: 'CERT-DISP-001',
          disposalLocation: 'Main Incinerator',
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('getDisposalAuditHistory (BE-140)', () => {
    it('should aggregate lifecycle events and stock ledger transactions for an executed request', async () => {
      const mockDate = new Date()
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        requestNumber: 'DISP-2026-00001',
        status: 'EXECUTED',
        disposalMethod: 'DESTRUCTION',
        reason: 'Expired chemical lots',
        createdAt: mockDate,
        updatedAt: mockDate,
        executedAt: mockDate,
        certificateNumber: 'CERT-999',
        witnessName: 'Agent Smith',
        requester: { id: 'usr-1', fullName: 'Requester One' },
        approvedByUser: { id: 'usr-2', fullName: 'Approver Two' },
        executedByUser: { id: 'usr-3', fullName: 'Executor Three' },
        store: { name: 'Main Store' },
        lines: [{ id: 'line-1', quantity: 10 }],
      })

      prisma.stockCardTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          transactionType: 'DISPOSAL',
          quantity: -10,
          referenceNumber: 'DISP-2026-00001',
        },
      ])

      const result = await getDisposalAuditHistory('disp-1')

      expect(result.summary.requestNumber).toBe('DISP-2026-00001')
      expect(result.summary.currentStatus).toBe('EXECUTED')
      expect(result.summary.totalItemsDisposed).toBe(10)
      expect(result.events.length).toBeGreaterThanOrEqual(3) // Created, Approved, Executed
      expect(result.transactions.length).toBe(1)
    })
  })
})
