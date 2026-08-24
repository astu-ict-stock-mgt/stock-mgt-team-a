/**
 * Reconciliation Request DTO Schemas (Zod)
 * Task: BE-146 (Implement Reconciliation Approval API)
 * SRS Traceability: Section 12 (Stock Taking & Reconciliation), SRS BR-19
 */

import { z } from 'zod'

export const createReconciliationSchema = z.object({
  storeId: z.string({
    required_error: 'storeId is required',
  }).min(1, 'storeId cannot be empty'),
  countDate: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        itemId: z.string({ required_error: 'itemId is required' }).min(1),
        locationId: z.string().optional(),
        systemQuantity: z.number().int().min(0, 'systemQuantity must be a non-negative integer'),
        physicalCount: z.number().int().min(0, 'physicalCount must be a non-negative integer'),
        unitCost: z.number().optional(),
        remarks: z.string().optional(),
      })
    )
    .optional(),
})

export const approveReconciliationSchema = z.object({
  approved: z.boolean({
    required_error: 'approved status boolean is required',
    invalid_type_error: 'approved must be a boolean',
  }),
  notes: z.string().optional(),
})
