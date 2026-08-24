/**
 * Disposal Request DTO Schemas (Zod)
 * Task: BE-137 (Implement Disposal Request API)
 * SRS Traceability: Section 11 (Disposal Module), Clarification Register C-13
 */

import { z } from 'zod'

export const createDisposalSchema = z.object({
  disposalMethod: z.enum(['AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLING', 'TRANSFER_OUT'], {
    errorMap: () => ({ message: 'Invalid disposal method' }),
  }),
  storeId: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export const evaluateDisposalSchema = z.object({
  notes: z.string().optional(),
})

export const approveDisposalSchema = z.object({
  approved: z.boolean().optional().default(true),
  notes: z.string().optional(),
})
