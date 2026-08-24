/**
 * Permission Management DTOs (Data Transfer Objects)
 * Task: BE-037 (Permission Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import Joi from 'joi'

/**
 * Create Permission Schema
 */
export const createPermissionSchema = Joi.object({
  code: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Permission code must be at least 2 characters',
    'string.max': 'Permission code must not exceed 50 characters',
    'any.required': 'Permission code is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Permission name must be at least 2 characters',
    'string.max': 'Permission name must not exceed 100 characters',
    'any.required': 'Permission name is required',
  }),
  description: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
})

/**
 * Update Permission Schema
 */
export const updatePermissionSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Permission name must be at least 2 characters',
    'string.max': 'Permission name must not exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
})
