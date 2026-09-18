import { z } from 'zod'

export const AssetReturnStatusEnum = z.enum([
  'SUBMITTED',
  'PENDING_INSPECTION',
  'UNDER_INSPECTION',
  'ACCEPTED',
  'ACCEPTED_WITH_REPAIR',
  'REJECTED',
  'CANCELLED',
])

export const AssetReturnDecisionEnum = z.enum([
  'ACCEPT_RETURN',
  'ACCEPT_WITH_REPAIR',
  'REJECT_RETURN',
  'RECOMMEND_DISPOSAL',
])

export const AssetPhysicalConditionEnum = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
])

export const AssetTechnicalConditionEnum = z.enum([
  'OPERATIONAL',
  'PARTIALLY_OPERATIONAL',
  'NON_OPERATIONAL',
])

export const createAssetReturnSchema = z.object({
  assetId: z.string().uuid({ message: 'Valid asset ID is required' }),
  reason: z.string().min(3, { message: 'Return reason must be at least 3 characters' }),
  notes: z.string().optional().nullable(),
})

export const assignTecSchema = z.object({
  tecUserIds: z
    .array(z.string().uuid({ message: 'Valid TEC user ID is required' }))
    .min(1, { message: 'At least one TEC evaluator must be assigned' }),
})

export const recordInspectionSchema = z.object({
  physicalCondition: AssetPhysicalConditionEnum,
  technicalCondition: AssetTechnicalConditionEnum,
  isComplete: z.boolean().default(true),
  serialNumberVerified: z.boolean().default(true),
  assetTagVerified: z.boolean().default(true),
  observedDamage: z.string().optional().nullable(),
  missingAccessories: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  recommendation: z.string().optional().nullable(),
  decision: AssetReturnDecisionEnum.optional(),
})

export const approveAssetReturnSchema = z.object({
  decision: AssetReturnDecisionEnum,
  approvalNotes: z.string().optional().nullable(),
})
