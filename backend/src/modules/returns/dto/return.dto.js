/**
 * Stock Return Note (SRN / Return) DTO Schemas (Zod)
 * Task: BE-117 (Implement Return Request APIs)
 * SRS Traceability: Section 7 (Stock Return Module), NFR-06 (Usability)
 */

import { z } from 'zod'

export const returnLineSchema = z.object({
  itemId: z.string({
    required_error: 'itemId is required',
  }).min(1, 'itemId cannot be empty'),

  quantityReturned: z
    .number({
      required_error: 'quantityReturned is required',
    })
    .int('quantityReturned must be an integer')
    .positive('quantityReturned must be greater than zero'),

  condition: z.string().optional(),
  remarks: z.string().optional(),
})

export const createReturnSchema = z.object({
  storeId: z.string({
    required_error: 'storeId is required',
  }).min(1, 'storeId cannot be empty'),

  requisitionId: z.string().optional(),

  reason: z
    .enum(['UNUSED', 'DEFECTIVE', 'EXPIRED', 'EXCESS', 'WRONG_SPECIFICATION'], {
      errorMap: () => ({ message: 'Invalid return reason code' }),
    })
    .optional(),

  notes: z.string().optional(),

  lines: z
    .array(returnLineSchema, {
      required_error: 'lines array is required',
    })
    .min(1, 'Return request must contain at least one item line'),
})

export const evaluateReturnSchema = z.object({
  remarks: z.string().optional(),
})

export const approveReturnSchema = z.object({
  disposition: z
    .enum(['RESTOCK', 'QUARANTINE', 'REPAIR', 'DISPOSAL', 'REPLACE'], {
      errorMap: () => ({ message: 'Invalid return disposition code' }),
    })
    .optional(),
  remarks: z.string().optional(),
  isApproved: z.boolean().optional(),
})
