/**
 * Stock Transfer Request (STR) DTO Schemas (Zod)
 * Task: BE-124 (Implement Transfer Request APIs)
 * SRS Traceability: Section 8 (Stock Transfer Module), Clarification Register C-10
 */

import { z } from 'zod'

export const transferLineSchema = z.object({
  itemId: z.string({
    required_error: 'itemId is required',
  }).min(1, 'itemId cannot be empty'),

  quantityRequested: z
    .number({
      required_error: 'quantityRequested is required',
    })
    .int('quantityRequested must be an integer')
    .positive('quantityRequested must be greater than zero'),

  remarks: z.string().optional(),
})

export const createTransferSchema = z.object({
  transferType: z
    .enum(['BIN_TO_BIN', 'STORE_TO_STORE', 'DEPT_TO_STORE', 'STORE_TO_DEPT'], {
      errorMap: () => ({ message: 'Invalid transfer type code' }),
    })
    .default('STORE_TO_STORE'),

  sourceStoreId: z.string({
    required_error: 'sourceStoreId is required',
  }).min(1, 'sourceStoreId cannot be empty'),

  destinationStoreId: z.string({
    required_error: 'destinationStoreId is required',
  }).min(1, 'destinationStoreId cannot be empty'),

  sourceLocationId: z.string().optional(),
  destinationLocationId: z.string().optional(),

  notes: z.string().optional(),

  lines: z
    .array(transferLineSchema, {
      required_error: 'lines array is required',
    })
    .min(1, 'Transfer request must contain at least one item line'),
})

export const approveTransferSchema = z.object({
  notes: z.string().optional(),
  isApproved: z.boolean().optional(),
})
