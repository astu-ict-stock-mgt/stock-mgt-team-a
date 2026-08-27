/**
 * Role Management DTOs (Data Transfer Objects)
 * Task: BE-036 (Role Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import { z } from 'zod'

/**
 * Create Role Schema
 */
export const createRoleSchema = z.object({
  code: z.string().min(2, 'Role code must be at least 2 characters').max(50, 'Role code must not exceed 50 characters'),
  name: z.string().min(2, 'Role name must be at least 2 characters').max(100, 'Role name must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
})

/**
 * Update Role Schema
 */
export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').max(100, 'Role name must not exceed 100 characters').optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').nullable().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided for update' })

/**
 * Assign Permissions Schema
 */
export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()).min(1, 'At least one permission ID must be provided'),
})
