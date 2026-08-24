/**
 * Store Issue Voucher (SIV/ISIV) DTO Schemas (Zod)
 * Tasks: BE-106, BE-107, BE-111 (Gate/Dispatch Verification API)
 * SRS Traceability: Section 6 (Store Issue Module), NFR-06 (Usability)
 */

import { z } from 'zod'

export const sivLineSchema = z.object({
  itemId: z.string({
    required_error: 'itemId is required',
  }).min(1, 'itemId cannot be empty'),

  quantityIssued: z
    .number({
      required_error: 'quantityIssued is required',
    })
    .int('quantityIssued must be an integer')
    .positive('quantityIssued must be greater than zero'),

  unitCost: z.number().positive('unitCost must be positive').optional(),
  remarks: z.string().optional(),
})

export const createSivSchema = z.object({
  requisitionId: z.string({
    required_error: 'requisitionId is required',
  }).min(1, 'requisitionId cannot be empty'),

  storeId: z.string({
    required_error: 'storeId is required',
  }).min(1, 'storeId cannot be empty'),

  issuedToUserId: z.string({
    required_error: 'issuedToUserId is required',
  }).min(1, 'issuedToUserId cannot be empty'),

  notes: z.string().optional(),

  lines: z
    .array(sivLineSchema, {
      required_error: 'lines array is required',
    })
    .min(1, 'SIV must contain at least one item line'),
})

export const lineAmendmentSchema = z.object({
  lineId: z.string({
    required_error: 'lineId is required',
  }),

  quantityIssued: z
    .number({
      required_error: 'quantityIssued is required',
    })
    .int('quantityIssued must be an integer')
    .positive('quantityIssued must be greater than zero'),

  remarks: z.string().optional(),
})

export const amendSivSchema = z.object({
  issuedToUserId: z.string().optional(),
  notes: z.string().optional(),
  lineAmendments: z.array(lineAmendmentSchema).optional(),
})

export const verifyDispatchSchema = z.object({
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  gateNumber: z.string().optional(),
  remarks: z.string().optional(),
})
