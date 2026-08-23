/**
 * Shelf-Life DTO Schemas (Zod)
 * Task: BE-134 (Implement Expiry/Status Rules)
 * SRS Traceability: Section 10 (Shelf-Life & Expiry Module), Clarification Register C-12
 */

import { z } from 'zod'

export const createBatchSchema = z.object({
  itemId: z.string({
    required_error: 'itemId is required',
  }).min(1, 'itemId cannot be empty'),

  batchNumber: z.string({
    required_error: 'batchNumber is required',
  }).min(1, 'batchNumber cannot be empty'),

  quantity: z.number({
    required_error: 'quantity is required',
  }).int('quantity must be an integer').positive('quantity must be greater than zero'),

  expiryDate: z.string({
    required_error: 'expiryDate is required',
  }).min(1, 'expiryDate cannot be empty'),

  alertDaysBeforeExpiry: z.number().int().positive().optional().default(30),

  storeId: z.string().optional(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
})
