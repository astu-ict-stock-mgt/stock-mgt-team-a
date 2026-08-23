/**
 * Fixed Asset DTO Schemas (Zod)
 * Task: BE-130 (Implement Asset Registration Service/API)
 * SRS Traceability: Section 9 (Fixed Assets Register), Clarification Register C-11
 */

import { z } from 'zod'

export const createAssetSchema = z.object({
  name: z.string({
    required_error: 'name is required',
  }).min(1, 'name cannot be empty'),

  itemId: z.string().optional(),
  grnId: z.string().optional(),
  serialNumber: z.string().optional(),
  category: z.string().optional(),

  custodianId: z.string().optional(),
  departmentId: z.string().optional(),
  locationId: z.string().optional(),

  purchaseDate: z.string().optional(),
  purchaseCost: z.number().nonnegative('purchaseCost cannot be negative').optional(),
  currentValue: z.number().nonnegative('currentValue cannot be negative').optional(),
  notes: z.string().optional(),
})

export const assignCustodySchema = z.object({
  custodianId: z.string({
    required_error: 'custodianId is required',
  }).min(1, 'custodianId cannot be empty'),

  departmentId: z.string().optional(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
})
