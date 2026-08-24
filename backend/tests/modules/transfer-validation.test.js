/**
 * Transfer Source / Destination Validation & Posting Unit Tests
 * Tasks: BE-127 (Implement Transfer Source/Destination Validation) & BE-126 (Transfer Execution Posting)
 * SRS Traceability: Section 10.1 (Core Entities),
 *                   FR-35 (material transfer requests),
 *                   FR-36 (transfer approval/rejection and execution),
 *                   BR-06 (non-negative balances),
 *                   BR-15 (atomic transfer movement),
 *                   P-3 (non-negative balances default),
 *                   P-5 (idempotent finalisation),
 *                   Clarification C-10 (transfer policy)
 */

import { describe, it, expect, vi } from 'vitest'
import { TransferValidationService } from '../../src/modules/transfers/transfer-validation.service.js'
import { TransferPostingService } from '../../src/modules/transfers/transfer-posting.service.js'
import {
  createTransferSchema,
  TransferTypeEnum,
  TransferStatusEnum,
} from '../../src/modules/transfers/dto/transfer.dto.js'
import {
  NotFoundError,
  ValidationError,
  InsufficientStockError,
  InvalidStatusError,
  InvalidSourceError,
  InvalidDestinationError,
  DuplicatePostingError,
} from '../../src/utils/errors.js'

describe('BE-127: Transfer Source/Destination Validation Tests', () => {
  describe('DTO & Enum Validation', () => {
    it('verifies TransferType and TransferStatus enum values', () => {
      expect(TransferTypeEnum.options).toEqual([
        'STORE_TO_STORE',
        'BIN_TO_BIN',
        'STORE_TO_DEPT',
        'DEPT_TO_STORE',
      ])

      expect(TransferStatusEnum.options).toEqual([
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'REJECTED',
        'IN_TRANSIT',
        'COMPLETED',
        'CANCELLED',
      ])
    })

    it('validates a correct transfer creation payload', () => {
      const payload = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: '550e8400-e29b-41d4-a716-446655440001',
        destinationStoreId: '550e8400-e29b-41d4-a716-446655440002',
        reason: 'Monthly regional stock balancing',
        lines: [
          {
            itemId: 'item-uuid-laptop-01',
            quantity: 3,
            remarks: 'High performance units',
          },
        ],
      }

      const result = createTransferSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('rejects a transfer request with identical source and destination stores', () => {
      const sameStoreId = '550e8400-e29b-41d4-a716-446655440001'
      const payload = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: sameStoreId,
        destinationStoreId: sameStoreId,
        reason: 'Invalid transfer to same store',
        lines: [{ itemId: 'item-1', quantity: 2 }],
      }

      const result = createTransferSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes('Source and destination cannot be identical')
          )
        ).toBe(true)
      }
    })

    it('rejects a transfer request with duplicate items in lines', () => {
      const payload = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: 'store-1',
        destinationStoreId: 'store-2',
        reason: 'Duplicate item test',
        lines: [
          { itemId: 'item-1', quantity: 2 },
          { itemId: 'item-1', quantity: 5 }, // duplicate item
        ],
      }

      const result = createTransferSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes('Duplicate items within the same transfer request are not allowed')
          )
        ).toBe(true)
      }
    })

    it('rejects a transfer request with non-positive quantities', () => {
      const zeroQtyPayload = {
        sourceStoreId: 'store-1',
        destinationStoreId: 'store-2',
        reason: 'Zero quantity',
        lines: [{ itemId: 'item-1', quantity: 0 }],
      }
      const negQtyPayload = {
        sourceStoreId: 'store-1',
        destinationStoreId: 'store-2',
        reason: 'Negative quantity',
        lines: [{ itemId: 'item-1', quantity: -4 }],
      }

      expect(createTransferSchema.safeParse(zeroQtyPayload).success).toBe(false)
      expect(createTransferSchema.safeParse(negQtyPayload).success).toBe(false)
    })
  })

  describe('Preconditions Validation (validatePreconditions)', () => {
    it('throws NotFoundError when transfer request is null or undefined', () => {
      expect(() => TransferValidationService.validatePreconditions(null)).toThrow(NotFoundError)
    })

    it('throws DuplicatePostingError when transfer is already COMPLETED (idempotency guard P-5)', () => {
      const completedTransfer = {
        id: 'trf-1',
        transferNumber: 'TRF-2026-00001',
        status: 'COMPLETED',
        lines: [{ itemId: 'item-1', quantity: 2 }],
      }

      expect(() =>
        TransferValidationService.validatePreconditions(completedTransfer)
      ).toThrow(DuplicatePostingError)
    })

    it('throws InvalidStatusError when transfer is in DRAFT, SUBMITTED, REJECTED, or CANCELLED status', () => {
      const invalidStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED', 'CANCELLED']

      for (const status of invalidStatuses) {
        const transfer = {
          id: 'trf-1',
          transferNumber: 'TRF-2026-00001',
          status,
          lines: [{ itemId: 'item-1', quantity: 2 }],
        }

        expect(() => TransferValidationService.validatePreconditions(transfer)).toThrow(
          InvalidStatusError
        )
      }
    })

    it('throws ValidationError when transfer request has no lines', () => {
      const emptyTransfer = {
        id: 'trf-1',
        status: 'APPROVED',
        lines: [],
      }

      expect(() => TransferValidationService.validatePreconditions(emptyTransfer)).toThrow(
        ValidationError
      )
    })

    it('passes when transfer is in APPROVED status with item lines', () => {
      const approvedTransfer = {
        id: 'trf-1',
        status: 'APPROVED',
        lines: [{ itemId: 'item-1', quantity: 2 }],
      }

      expect(() =>
        TransferValidationService.validatePreconditions(approvedTransfer)
      ).not.toThrow()
    })
  })

  describe('Source & Destination Validity (validateSourceAndDestination)', () => {
    it('throws InvalidSourceError when sourceStoreId is missing for store transfer', async () => {
      const transfer = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: null,
        destinationStoreId: 'store-dest-02',
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).rejects.toThrow(InvalidSourceError)
    })

    it('throws InvalidDestinationError when destinationStoreId is missing for store transfer', async () => {
      const transfer = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: 'store-src-01',
        destinationStoreId: null,
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).rejects.toThrow(InvalidDestinationError)
    })

    it('throws InvalidDestinationError when source and destination stores are identical', async () => {
      const transfer = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: 'store-same-01',
        destinationStoreId: 'store-same-01',
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).rejects.toThrow(InvalidDestinationError)
    })

    it('throws InvalidSourceError when source store is inactive or not found', async () => {
      const transfer = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: 'store-inactive-01',
        destinationStoreId: 'store-dest-02',
        sourceStore: { id: 'store-inactive-01', name: 'Inactive Store', status: 'INACTIVE' },
        destinationStore: { id: 'store-dest-02', name: 'Active Dest Store', status: 'ACTIVE' },
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).rejects.toThrow(InvalidSourceError)
    })

    it('throws InvalidDestinationError when destination store is inactive', async () => {
      const transfer = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: 'store-src-01',
        destinationStoreId: 'store-inactive-02',
        sourceStore: { id: 'store-src-01', name: 'Active Src Store', status: 'ACTIVE' },
        destinationStore: { id: 'store-inactive-02', name: 'Inactive Dest Store', status: 'INACTIVE' },
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).rejects.toThrow(InvalidDestinationError)
    })

    it('throws InvalidDestinationError when source and destination bin locations are identical', async () => {
      const transfer = {
        transferType: 'BIN_TO_BIN',
        sourceLocationId: 'loc-same-bin',
        destinationLocationId: 'loc-same-bin',
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).rejects.toThrow(InvalidDestinationError)
    })

    it('throws InvalidSourceError when source bin location is inactive', async () => {
      const transfer = {
        transferType: 'BIN_TO_BIN',
        sourceLocationId: 'loc-src-bin',
        destinationLocationId: 'loc-dest-bin',
        sourceLocation: { id: 'loc-src-bin', status: 'INACTIVE' },
        destinationLocation: { id: 'loc-dest-bin', status: 'ACTIVE' },
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).rejects.toThrow(InvalidSourceError)
    })

    it('passes when source and destination stores and locations are distinct and ACTIVE', async () => {
      const transfer = {
        transferType: 'STORE_TO_STORE',
        sourceStoreId: 'store-src-01',
        destinationStoreId: 'store-dest-02',
        sourceStore: { id: 'store-src-01', name: 'Main Store', status: 'ACTIVE' },
        destinationStore: { id: 'store-dest-02', name: 'Branch Store', status: 'ACTIVE' },
      }

      await expect(
        TransferValidationService.validateSourceAndDestination(transfer)
      ).resolves.not.toThrow()
    })
  })

  describe('Source Stock Availability Validation (validateSourceAvailability)', () => {
    it('throws ValidationError if any line quantity is <= 0', async () => {
      const transfer = {
        sourceStoreId: 'store-src-01',
        lines: [{ itemId: 'item-1', quantity: 0 }],
      }

      await expect(
        TransferValidationService.validateSourceAvailability(transfer)
      ).rejects.toThrow(ValidationError)
    })

    it('throws InsufficientStockError when source stock card does not exist (zero stock)', async () => {
      const transfer = {
        sourceStoreId: 'store-src-01',
        lines: [{ itemId: 'item-1', quantity: 5, item: { code: 'ITM-01', name: 'Laptop' } }],
      }

      const mockDb = {
        stockCard: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      }

      await expect(
        TransferValidationService.validateSourceAvailability(transfer, mockDb)
      ).rejects.toThrow(InsufficientStockError)
    })

    it('throws InsufficientStockError when source availableQty < requested quantity', async () => {
      const transfer = {
        sourceStoreId: 'store-src-01',
        lines: [{ itemId: 'item-1', quantity: 10 }],
      }

      const mockDb = {
        stockCard: {
          findUnique: vi.fn().mockResolvedValue({
            quantity: 5,
            availableQty: 4, // only 4 available, requested 10
            item: { code: 'ITM-01', name: 'Laptop' },
          }),
        },
      }

      await expect(
        TransferValidationService.validateSourceAvailability(transfer, mockDb)
      ).rejects.toThrow(InsufficientStockError)
    })

    it('throws InsufficientStockError when source binCard quantity < requested quantity in bin transfer', async () => {
      const transfer = {
        sourceStoreId: 'store-src-01',
        sourceLocationId: 'bin-01',
        lines: [{ itemId: 'item-1', quantity: 5, sourceLocationId: 'bin-01' }],
      }

      const mockDb = {
        stockCard: {
          findUnique: vi.fn().mockResolvedValue({
            quantity: 20,
            availableQty: 20, // store level ok
            item: { code: 'ITM-01', name: 'Laptop' },
          }),
        },
        binCard: {
          findUnique: vi.fn().mockResolvedValue({
            quantity: 2, // bin only has 2, requested 5
            item: { code: 'ITM-01', name: 'Laptop' },
            location: { code: 'BIN-A1', name: 'Shelf A Bin 1' },
          }),
        },
      }

      await expect(
        TransferValidationService.validateSourceAvailability(transfer, mockDb)
      ).rejects.toThrow(InsufficientStockError)
    })

    it('passes when source stock card and bin card have sufficient stock', async () => {
      const transfer = {
        sourceStoreId: 'store-src-01',
        sourceLocationId: 'bin-01',
        lines: [{ itemId: 'item-1', quantity: 3, sourceLocationId: 'bin-01' }],
      }

      const mockDb = {
        stockCard: {
          findUnique: vi.fn().mockResolvedValue({
            quantity: 15,
            availableQty: 10, // 10 >= 3 -> OK
            item: { code: 'ITM-01', name: 'Laptop' },
          }),
        },
        binCard: {
          findUnique: vi.fn().mockResolvedValue({
            quantity: 8, // 8 >= 3 -> OK
            item: { code: 'ITM-01', name: 'Laptop' },
            location: { code: 'BIN-A1', name: 'Shelf A Bin 1' },
          }),
        },
      }

      await expect(
        TransferValidationService.validateSourceAvailability(transfer, mockDb)
      ).resolves.not.toThrow()
    })
  })

  describe('Full Validation Pipeline (validateTransferExecution)', () => {
    it('orchestrates preconditions, source/destination and availability checks successfully', async () => {
      const validTransfer = {
        id: 'trf-uuid-1',
        transferNumber: 'TRF-2026-00001',
        transferType: 'STORE_TO_STORE',
        status: 'APPROVED',
        sourceStoreId: 'store-src-01',
        destinationStoreId: 'store-dest-02',
        sourceStore: { id: 'store-src-01', name: 'Main Store', status: 'ACTIVE' },
        destinationStore: { id: 'store-dest-02', name: 'Branch Store', status: 'ACTIVE' },
        lines: [
          {
            itemId: 'item-1',
            quantity: 2,
            item: { id: 'item-1', code: 'LAP-01', name: 'Dell Workstation' },
          },
        ],
      }

      const mockDb = {
        stockCard: {
          findUnique: vi.fn().mockResolvedValue({
            quantity: 10,
            availableQty: 8,
            item: validTransfer.lines[0].item,
          }),
        },
      }

      const result = await TransferValidationService.validateTransferExecution(
        validTransfer,
        mockDb
      )
      expect(result.isValid).toBe(true)
      expect(result.transferRequest.id).toBe(validTransfer.id)
    })
  })
})
