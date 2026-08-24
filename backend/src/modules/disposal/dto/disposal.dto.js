/**
 * Disposal Request & Execution DTO Schemas (Zod)
 * Tasks: BE-137, BE-138, BE-139, BE-140
 * SRS Traceability: Section 7.1 (Disposal State Model), Section 13 (Security), BR-18, FR-38, FR-39
 */

import { z } from 'zod'

export const createDisposalSchema = z.object({
  disposalMethod: z.enum(['AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLING', 'TRANSFER_OUT', 'WRITE_OFF'], {
    errorMap: () => ({ message: 'Invalid disposal method' }),
  }),
  storeId: z.string().optional().nullable(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export const evaluateDisposalSchema = z.object({
  notes: z.string().optional(),
})

export const approveDisposalSchema = z.object({
  notes: z.string().optional(),
  disposalMethod: z.enum(['AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLING', 'TRANSFER_OUT', 'WRITE_OFF']).optional(),
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
