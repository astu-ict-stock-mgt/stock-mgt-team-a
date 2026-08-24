/**
 * Return & Return Lines DTO Schemas (Zod)
 * Tasks: BE-114 (Create Return Schema), BE-115 (Create Return Lines Schema)
 * SRS Traceability: Section 10.1 (Core Entities: returns, return_lines),
 *                   FR-32 (material return requests / SRN),
 *                   FR-33 (technical evaluation of returned materials),
 *                   FR-34 (approval/rejection and stock update),
 *                   BR-13 (return stock updates after approval & disposition),
 *                   BR-21 (auditability and no hard-delete),
 *                   Clarification C-09 (disposition options)
 */

import { z } from 'zod'

export const ReturnStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'PENDING_EVALUATION',
  'EVALUATED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
])

export const ReturnDispositionEnum = z.enum([
  'RESTOCK',
  'QUARANTINE',
  'REPAIR',
  'DISPOSAL',
  'REPLACEMENT',
])

export const returnLineSchema = z.object({
  itemId: z
    .string({
      required_error: 'itemId is required',
    })
    .min(1, 'itemId cannot be empty'),

  sivLineId: z.string().min(1, 'sivLineId cannot be empty').optional().nullable(),

  quantityReturned: z
    .number({
      required_error: 'quantityReturned is required',
    })
    .int('quantityReturned must be an integer')
    .positive('quantityReturned must be greater than zero'),

  unitCost: z.number().min(0, 'unitCost cannot be negative').optional().nullable(),
  totalCost: z.number().min(0, 'totalCost cannot be negative').optional().nullable(),

  condition: z.string().max(255).optional().nullable(),
  disposition: ReturnDispositionEnum.optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
})

export const createReturnSchema = z
  .object({
    sivId: z.string().min(1, 'sivId cannot be empty').optional().nullable(),

    storeId: z
      .string({
        required_error: 'storeId is required',
      })
      .min(1, 'storeId cannot be empty'),

    departmentId: z.string().min(1, 'departmentId cannot be empty').optional().nullable(),

    returnedBy: z
      .string({
        required_error: 'returnedBy is required',
      })
      .min(1, 'returnedBy cannot be empty')
      .optional(),

    reason: z
      .string({
        required_error: 'reason is required',
      })
      .min(3, 'reason must be at least 3 characters long')
      .max(1000, 'reason must not exceed 1000 characters'),

    requiresEvaluation: z.boolean().default(false),

    notes: z.string().max(2000).optional().nullable(),

    lines: z
      .array(returnLineSchema, {
        required_error: 'lines array is required',
      })
      .min(1, 'Store Return Note must contain at least one return line'),
  })
  .refine(
    (data) => {
      const itemIds = data.lines.map((l) => l.itemId)
      return new Set(itemIds).size === itemIds.length
    },
    {
      message: 'Duplicate items within the same return request are not allowed',
      path: ['lines'],
    }
  )

export const updateReturnLineSchema = z.object({
  quantityReturned: z
    .number()
    .int('quantityReturned must be an integer')
    .positive('quantityReturned must be greater than zero')
    .optional(),

  unitCost: z.number().min(0, 'unitCost cannot be negative').optional().nullable(),
  totalCost: z.number().min(0, 'totalCost cannot be negative').optional().nullable(),

  condition: z.string().max(255).optional().nullable(),
  disposition: ReturnDispositionEnum.optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
})
