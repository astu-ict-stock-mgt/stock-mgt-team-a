/**
 * Material Transfer DTO Schemas (Zod)
 * Tasks: BE-121 (Create Transfer Request Schema), BE-122 (Create Transfer Lines Schema), BE-127 (Transfer Validation)
 * SRS Traceability: Section 10.1 (Core Entities: transfer_requests, transfer_lines),
 *                   FR-35 (create material transfer requests),
 *                   FR-36 (support transfer approval/rejection and execution),
 *                   BR-15 (atomic transfer posting: decrease source, increase destination),
 *                   BR-06 (non-negative balances),
 *                   Clarification C-10 (transfer types)
 */

import { z } from 'zod'

export const TransferTypeEnum = z.enum([
  'STORE_TO_STORE',
  'BIN_TO_BIN',
  'STORE_TO_DEPT',
  'DEPT_TO_STORE',
])

export const TransferStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
])

export const transferLineSchema = z.object({
  itemId: z
    .string({
      required_error: 'itemId is required',
    })
    .min(1, 'itemId cannot be empty'),

  quantity: z
    .number({
      required_error: 'quantity is required',
    })
    .int('quantity must be an integer')
    .positive('quantity must be greater than zero'),

  sourceLocationId: z.string().min(1, 'sourceLocationId cannot be empty').optional().nullable(),
  destinationLocationId: z.string().min(1, 'destinationLocationId cannot be empty').optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
})

export const createTransferSchema = z
  .object({
    transferType: TransferTypeEnum.default('STORE_TO_STORE'),
    sourceStoreId: z.string().min(1, 'sourceStoreId cannot be empty').optional().nullable(),
    destinationStoreId: z.string().min(1, 'destinationStoreId cannot be empty').optional().nullable(),
    sourceLocationId: z.string().min(1, 'sourceLocationId cannot be empty').optional().nullable(),
    destinationLocationId: z.string().min(1, 'destinationLocationId cannot be empty').optional().nullable(),
    sourceDepartmentId: z.string().min(1, 'sourceDepartmentId cannot be empty').optional().nullable(),
    destinationDepartmentId: z.string().min(1, 'destinationDepartmentId cannot be empty').optional().nullable(),
    requestedBy: z.string().min(1, 'requestedBy cannot be empty').optional(),
    reason: z
      .string({
        required_error: 'reason is required',
      })
      .min(3, 'reason must be at least 3 characters long')
      .max(1000, 'reason must not exceed 1000 characters'),
    notes: z.string().max(2000).optional().nullable(),
    lines: z
      .array(transferLineSchema, {
        required_error: 'lines array is required',
      })
      .min(1, 'Transfer request must contain at least one transfer line'),
  })
  .refine(
    (data) => {
      // Validate store-to-store distinctness
      if (data.transferType === 'STORE_TO_STORE') {
        if (data.sourceStoreId && data.destinationStoreId && data.sourceStoreId === data.destinationStoreId) {
          return false
        }
      }
      // Validate bin-to-bin distinctness
      if (data.transferType === 'BIN_TO_BIN') {
        if (data.sourceLocationId && data.destinationLocationId && data.sourceLocationId === data.destinationLocationId) {
          return false
        }
      }
      return true
    },
    {
      message: 'Source and destination cannot be identical',
      path: ['destinationStoreId'],
    }
  )
  .refine(
    (data) => {
      const itemIds = data.lines.map((l) => l.itemId)
      return new Set(itemIds).size === itemIds.length
    },
    {
      message: 'Duplicate items within the same transfer request are not allowed',
      path: ['lines'],
    }
  )

export const approveTransferSchema = z.object({
  approvedBy: z.string().min(1, 'approvedBy cannot be empty').optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export const rejectTransferSchema = z.object({
  rejectionReason: z
    .string({
      required_error: 'rejectionReason is required',
    })
    .min(3, 'rejectionReason must be at least 3 characters long'),
})

export const executeTransferSchema = z.object({
  executedBy: z.string().min(1, 'executedBy cannot be empty').optional(),
  notes: z.string().max(1000).optional().nullable(),
})
