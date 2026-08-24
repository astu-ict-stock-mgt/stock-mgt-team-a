/**
 * Disposal Request & Execution DTO Schemas (Zod)
 * Tasks: BE-137, BE-138, BE-139, BE-140
 * SRS Traceability: Section 7.1 (Disposal State Model), Section 13 (Security), BR-18, FR-38, FR-39
 */

import { z } from 'zod'

export const disposalLineSchema = z.object({
  itemId: z.string({
    required_error: 'itemId is required',
  }).min(1, 'itemId cannot be empty'),

  locationId: z.string().optional().nullable(),

  quantity: z
    .number({
      required_error: 'quantity is required',
    })
    .int('quantity must be an integer')
    .positive('quantity must be greater than zero'),

  unitCost: z.number().nonnegative('unitCost cannot be negative').optional().nullable(),

  condition: z.string().optional().nullable(),

  batchNumber: z.string().optional().nullable(),

  expiryDate: z.string().or(z.date()).optional().nullable(),

  remarks: z.string().optional().nullable(),
})

export const createDisposalSchema = z.object({
  storeId: z.string({
    required_error: 'storeId is required',
  }).min(1, 'storeId cannot be empty'),

  disposalMethod: z
    .enum(['AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLE', 'TRANSFER', 'WRITE_OFF'])
    .optional()
    .default('WRITE_OFF'),

  reason: z
    .string({
      required_error: 'reason is required',
    })
    .min(3, 'reason must be at least 3 characters long'),

  remarks: z.string().optional().nullable(),

  totalEstimatedValue: z.number().nonnegative().optional().nullable(),

  lines: z
    .array(disposalLineSchema, {
      required_error: 'lines array is required',
    })
    .min(1, 'Disposal request must contain at least one item line'),
})

export const approveDisposalSchema = z.object({
  approvalNotes: z.string().optional().nullable(),
  disposalMethod: z
    .enum(['AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLE', 'TRANSFER', 'WRITE_OFF'])
    .optional(),
})

export const rejectDisposalSchema = z.object({
  reason: z
    .string({
      required_error: 'Rejection reason is required',
    })
    .min(3, 'Rejection reason must be at least 3 characters long'),
})

export const executeDisposalSchema = z.object({
  executionNotes: z.string().optional().nullable(),
  witnessName: z.string().optional().nullable(),
  certificateNumber: z.string().optional().nullable(),
  disposalLocation: z.string().optional().nullable(),
})
