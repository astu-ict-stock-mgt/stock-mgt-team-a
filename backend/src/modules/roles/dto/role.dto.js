/**
 * Role Management DTOs (Data Transfer Objects)
 * Task: BE-036 (Role Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import Joi from 'joi'

/**
 * Create Role Schema
 */
export const createRoleSchema = Joi.object({
  code: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Role code must be at least 2 characters',
    'string.max': 'Role code must not exceed 50 characters',
    'any.required': 'Role code is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Role name must be at least 2 characters',
    'string.max': 'Role name must not exceed 100 characters',
    'any.required': 'Role name is required',
  }),
  description: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  permissionIds: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Permission IDs must be an array',
  }),
})

/**
 * Update Role Schema
 */
export const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Role name must be at least 2 characters',
    'string.max': 'Role name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
})

/**
 * Assign Permissions Schema
 */
export const assignPermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.base': 'Permission IDs must be an array',
    'array.min': 'At least one permission ID must be provided',
    'any.required': 'Permission IDs are required',
  }),
})
