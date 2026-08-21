/**
 * Requisition Request DTO Schemas (Zod)
 * Tasks: BE-099, BE-100 (Implement Requisition Approval Routing)
 * SRS Traceability: Section 6 (Requisition Module), NFR-06 (Usability)
 */

import { z } from 'zod'

export const requisitionLineSchema = z.object({
  itemId: z.string({
    required_error: 'itemId is required',
  }).min(1, 'itemId cannot be empty'),

  requestedQuantity: z
    .number({
      required_error: 'requestedQuantity is required',
    })
    .int('requestedQuantity must be an integer')
    .positive('requestedQuantity must be greater than zero'),

  remarks: z.string().optional(),
})

export const createRequisitionSchema = z.object({
  departmentId: z.string({
    required_error: 'departmentId is required',
  }).min(1, 'departmentId cannot be empty'),

  storeId: z.string({
    required_error: 'storeId is required',
  }).min(1, 'storeId cannot be empty'),

  purpose: z
    .string({
      required_error: 'purpose is required',
    })
    .min(3, 'purpose must be at least 3 characters long'),

  lines: z
    .array(requisitionLineSchema, {
      required_error: 'lines array is required',
    })
    .min(1, 'Requisition must contain at least one item line'),
})

export const lineApprovalSchema = z.object({
  lineId: z.string({
    required_error: 'lineId is required',
  }),

  approvedQuantity: z
    .number({
      required_error: 'approvedQuantity is required',
    })
    .int('approvedQuantity must be an integer')
    .min(0, 'approvedQuantity cannot be negative'),
})

export const approveRequisitionSchema = z.object({
  lineApprovals: z.array(lineApprovalSchema).optional(),
})

export const rejectRequisitionSchema = z.object({
  reason: z
    .string({
      required_error: 'Rejection reason is required',
    })
    .min(3, 'Rejection reason must be at least 3 characters long'),

  level: z.enum(['DEPARTMENT', 'PAO']).optional().default('DEPARTMENT'),
})
