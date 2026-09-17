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
      stockBatch: {
        findMany: vi.fn(),
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
    it('should throw ValidationError if requestedBy is missing', async () => {
      await expect(
        createDisposalRequest({ storeId: 'store-1', reason: 'Damaged' })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if disposalMethod is invalid', async () => {
      await expect(
        createDisposalRequest({ requestedBy: 'usr-1', disposalMethod: 'INVALID' })
      ).rejects.toThrow(ValidationError)
    })

    it('should create a disposal request in DRAFT status', async () => {
      const currentYear = new Date().getFullYear()
      prisma.disposalRequest.count.mockResolvedValue(0)

      const mockCreated = {
        id: 'disp-1',
        disposalNumber: `DISP-${currentYear}-00001`,
        storeId: 'store-1',
        requestedBy: 'usr-1',
        status: 'DRAFT',
        disposalMethod: 'WRITE_OFF',
        reason: 'Expired reagents',
        lines: [],
      }

      prisma.disposalRequest.create.mockResolvedValue(mockCreated)

      const result = await createDisposalRequest({
        storeId: 'store-1',
        requestedBy: 'usr-1',
        disposalMethod: 'WRITE_OFF',
        reason: 'Expired reagents',
      })

      expect(result.id).toBe('disp-1')
      expect(result.status).toBe('DRAFT')
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
          approvedBy: 'usr-pao',
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
      })

      const result = await approveDisposalRequest({
        id: 'disp-1',
        approvedBy: 'usr-pao',
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
          approvedBy: 'usr-pao',
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
          approvedBy: 'usr-pao',
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
        approvedBy: 'usr-pao',
        rejectionReason: 'Items still usable',
      })

      expect(result.status).toBe('REJECTED')
      expect(result.rejectionReason).toBe('Items still usable')
    })
  })

  describe('executeDisposal (BE-139)', () => {
    it('should throw ConflictError if request is already EXECUTED', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'EXECUTED',
        lines: [{ itemId: 'item-1', quantity: 5 }],
      })

      await expect(
        executeDisposal({ id: 'disp-1', executedBy: 'usr-pao' })
      ).rejects.toThrow(ConflictError)
    })

    it('should throw ConflictError if request is not in APPROVED status', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        status: 'DRAFT',
        lines: [{ itemId: 'item-1', quantity: 5 }],
      })

      await expect(
        executeDisposal({ id: 'disp-1', executedBy: 'usr-pao' })
      ).rejects.toThrow(ConflictError)
    })

    it('should throw ConflictError if stock card has insufficient stock', async () => {
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        disposalNumber: 'DISP-2026-00001',
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

      prisma.stockCard.findUnique.mockResolvedValue({
        id: 'sc-1',
        itemId: 'item-1',
        storeId: 'store-1',
        quantity: 3,
        availableQty: 3,
      })

      await expect(
        executeDisposal({ id: 'disp-1', executedBy: 'usr-pao' })
      ).rejects.toThrow(/Insufficient stock/)
    })

    it('should successfully execute disposal and deduct stock', async () => {
      const currentYear = new Date().getFullYear()
      const mockDisposal = {
        id: 'disp-1',
        disposalNumber: `DISP-${currentYear}-00001`,
        storeId: 'store-1',
        requestedBy: 'usr-requester',
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

      prisma.stockCard.findUnique.mockResolvedValue({
        id: 'sc-1',
        itemId: 'item-1',
        storeId: 'store-1',
        quantity: 20,
        availableQty: 20,
      })

      prisma.stockBatch.findMany.mockResolvedValue([
        { id: 'batch-1', remainingQty: 10, unitCost: '50' }
      ])

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
      }

      prisma.disposalRequest.update.mockResolvedValue(mockExecutedRecord)

      const result = await executeDisposal({
        id: 'disp-1',
        executedBy: 'usr-pao',
        executionNotes: 'Incinerated under environmental guidelines',
      })

      expect(result.status).toBe('EXECUTED')

      expect(prisma.stockCard.update).toHaveBeenCalledWith({
        where: { id: 'sc-1' },
        data: expect.objectContaining({
          quantity: 15,
          availableQty: 15,
        }),
      })

      expect(prisma.stockCardTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stockCardId: 'sc-1',
          transactionType: 'DISPOSAL',
          quantity: -5,
          referenceType: 'DISPOSAL_REQUEST',
          referenceId: 'disp-1',
          createdBy: 'usr-pao',
        }),
      })

      expect(prisma.stockBatch.findMany).toHaveBeenCalled()
      expect(prisma.stockBatch.update).toHaveBeenCalled()

      expect(prisma.disposalRequestLine.update).toHaveBeenCalledWith({
        where: { id: 'line-1' },
        data: expect.objectContaining({ status: 'EXECUTED' }),
      })
    })

    it('should successfully execute disposal for TRANSFER_OUT and persist handover metadata in proper DB columns (Directive 1095/2017)', async () => {
      const currentYear = new Date().getFullYear()
      const mockTransferDisposal = {
        id: 'disp-transfer-1',
        disposalNumber: `DISP-${currentYear}-00088`,
        storeId: 'store-1',
        requestedBy: 'usr-pao',
        status: 'APPROVED',
        disposalMethod: 'TRANSFER_OUT',
        // Existing proposal-time fields already stored as DB columns
        receivingPublicBody: null,
        authorizationRef: null,
        lines: [
          {
            id: 'line-1',
            itemId: 'item-1',
            locationId: 'loc-1',
            quantity: 8,
            item: { name: 'Laboratory Microscope' },
          },
        ],
      }

      prisma.disposalRequest.findUnique.mockResolvedValue(mockTransferDisposal)

      prisma.stockCard.findUnique.mockResolvedValue({
        id: 'sc-1',
        itemId: 'item-1',
        storeId: 'store-1',
        quantity: 15,
        availableQty: 15,
      })

      prisma.binCard.findUnique.mockResolvedValue({
        id: 'bin-1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 15,
      })

      const mockExecutedRecord = {
        ...mockTransferDisposal,
        status: 'EXECUTED',
        executedBy: 'usr-storekeeper',
        executedAt: new Date(),
        // Structured DB columns — NOT crammed into notes string
        receivingPublicBody: 'Regional Tech Center',
        authorizationRef: 'ASTU/DIR/2026/01',
        handoverDocRef: 'TR-VOUCH-101',
        recipientOfficer: 'Ato Dawit',
        witnessName: 'Store Head',
        executionNotes: 'Transferred in good condition',
        notes: 'Transferred in good condition',
      }

      prisma.disposalRequest.update.mockResolvedValue(mockExecutedRecord)

      const result = await executeDisposal({
        id: 'disp-transfer-1',
        executedBy: 'usr-storekeeper',
        executionNotes: 'Transferred in good condition',
        receivingPublicBody: 'Regional Tech Center',
        authorizationRef: 'ASTU/DIR/2026/01',
        handoverDocRef: 'TR-VOUCH-101',
        recipientOfficer: 'Ato Dawit',
        witnessName: 'Store Head',
      })

      expect(result.status).toBe('EXECUTED')
      expect(result.disposalMethod).toBe('TRANSFER_OUT')
      // Verify structured DB columns are persisted (Directive 1095/2017 audit traceability)
      expect(result.receivingPublicBody).toBe('Regional Tech Center')
      expect(result.authorizationRef).toBe('ASTU/DIR/2026/01')
      expect(result.handoverDocRef).toBe('TR-VOUCH-101')
      expect(result.recipientOfficer).toBe('Ato Dawit')
      expect(prisma.stockCard.update).toHaveBeenCalledWith({
        where: { id: 'sc-1' },
        data: expect.objectContaining({
          quantity: 7,
          availableQty: 7,
        }),
      })
      // notes on transaction should contain only free-text executionNotes, NOT crammed handover text
      expect(prisma.stockCardTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stockCardId: 'sc-1',
          transactionType: 'DISPOSAL',
          quantity: -8,
          notes: 'Transferred in good condition',
        }),
      })
      // Verify DisposalRequest.update was called with proper DB column fields
      expect(prisma.disposalRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'EXECUTED',
            receivingPublicBody: 'Regional Tech Center',
            authorizationRef: 'ASTU/DIR/2026/01',
            handoverDocRef: 'TR-VOUCH-101',
            recipientOfficer: 'Ato Dawit',
            witnessName: 'Store Head',
            executionNotes: 'Transferred in good condition',
          }),
        })
      )
    })
  })

  describe('getDisposalAuditHistory (BE-140)', () => {
    it('should aggregate lifecycle events and stock ledger transactions', async () => {
      const currentYear = new Date().getFullYear()
      const mockDate = new Date()
      prisma.disposalRequest.findUnique.mockResolvedValue({
        id: 'disp-1',
        disposalNumber: `DISP-${currentYear}-00001`,
        status: 'EXECUTED',
        disposalMethod: 'DESTRUCTION',
        reason: 'Expired chemical lots',
        createdAt: mockDate,
        updatedAt: mockDate,
        executedAt: mockDate,
        requestedByUser: { id: 'usr-1', fullName: 'Requester One' },
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
          referenceNumber: `DISP-${currentYear}-00001`,
        },
      ])

      const result = await getDisposalAuditHistory('disp-1')

      expect(result.summary.disposalNumber).toBe(`DISP-${currentYear}-00001`)
      expect(result.summary.currentStatus).toBe('EXECUTED')
      expect(result.events.length).toBeGreaterThanOrEqual(2)
      expect(result.transactions.length).toBe(1)
    })
  })
})
