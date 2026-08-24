/**
 * Shelf-Life & Expiry Management DTO Schemas (Zod)
 * Tasks: BE-132 (Shelf-Life Schema) & BE-133 (Shelf-Life Monitoring Service)
 * SRS Traceability: Section 10.1 (Core Entities),
 *                   FR-37 (perishable item expiry monitoring & alerts),
 *                   Clarification C-12 (per-batch expiry tracking: HEALTHY, NEAR_EXPIRY, EXPIRED)
 */

import { z } from 'zod'

export const ShelfLifeStatusEnum = z.enum(['HEALTHY', 'NEAR_EXPIRY', 'EXPIRED'])

export const recordBatchSchema = z.object({
  itemId: z
    .string({
      required_error: 'itemId is required',
    })
    .min(1, 'itemId cannot be empty'),

  batchNumber: z
    .string({
      required_error: 'batchNumber is required',
    })
    .min(1, 'batchNumber cannot be empty')
    .max(100, 'batchNumber cannot exceed 100 characters'),

  quantity: z
    .number({
      required_error: 'quantity is required',
    })
    .int('quantity must be an integer')
    .min(0, 'quantity cannot be negative'),

  expiryDate: z.coerce.date({
    required_error: 'expiryDate is required',
    invalid_type_error: 'expiryDate must be a valid date',
  }),

  alertDaysBeforeExpiry: z
    .number()
    .int('alertDaysBeforeExpiry must be an integer')
    .min(0, 'alertDaysBeforeExpiry cannot be negative')
    .default(30),

  storeId: z.string().min(1, 'storeId cannot be empty').optional().nullable(),
  locationId: z.string().min(1, 'locationId cannot be empty').optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const queryBatchesSchema = z.object({
  storeId: z.string().optional(),
  itemId: z.string().optional(),
  status: ShelfLifeStatusEnum.optional(),
  expiryBefore: z.coerce.date().optional(),
  expiryAfter: z.coerce.date().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const updateBatchQuantitySchema = z.object({
  quantityDelta: z
    .number({
      required_error: 'quantityDelta is required',
    })
    .int('quantityDelta must be an integer'),
  reason: z.string().max(500).optional(),
})

export const updateAlertDaysSchema = z.object({
  alertDaysBeforeExpiry: z
    .number({
      required_error: 'alertDaysBeforeExpiry is required',
    })
    .int('alertDaysBeforeExpiry must be an integer')
    .min(0, 'alertDaysBeforeExpiry cannot be negative'),
})
