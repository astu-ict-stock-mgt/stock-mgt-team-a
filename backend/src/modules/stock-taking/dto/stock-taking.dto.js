import { z } from 'zod'

const baseStockTakeSchema = z.object({
  storeId: z.string().uuid('Invalid store ID format'),
  scheduledDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  itemIds: z.array(z.string().uuid('Invalid item ID format')).optional(),
})

export const createStockTakeSchema = baseStockTakeSchema

export const recordCountSchema = z.object({
  itemId: z.string().uuid('Invalid item ID format'),
  physicalCount: z.number().int('Physical count must be an integer').min(0),
  locationId: z.string().uuid().optional(),
  varianceReason: z.string().max(500).optional(),
})

export const stockTakeQuerySchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'RECONCILED', 'CANCELLED']).optional(),
  storeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})
