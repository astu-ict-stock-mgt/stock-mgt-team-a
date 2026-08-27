/**
 * User Management DTOs (Data Transfer Objects)
 * Tasks: BE-034, BE-038 (User Management, Account Activation)
 * SRS Traceability: FR-01 (User Management)
 */

import Joi from 'joi'

/**
 * Create User Schema
 */
export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name must not exceed 100 characters',
    'any.required': 'Full name is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must not exceed 128 characters',
    'any.required': 'Password is required',
  }),
  roleIds: Joi.array().items(Joi.string().uuid()).optional().messages({
    'array.base': 'Role IDs must be an array',
    'string.uuid': 'Invalid role ID format',
  }),
})

/**
 * Update User Schema
 */
export const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name must not exceed 100 characters',
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Invalid email format',
  }),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
})

/**
 * Assign Roles Schema
 */
export const assignRolesSchema = Joi.object({
  roleIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.base': 'Role IDs must be an array',
    'array.min': 'At least one role ID must be provided',
    'string.uuid': 'Invalid role ID format',
    'any.required': 'Role IDs are required',
  }),
})

/**
 * Bulk Action Schema (for activation/deactivation)
 */
export const bulkActionSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.base': 'User IDs must be an array',
    'array.min': 'At least one user ID must be provided',
    'string.uuid': 'Invalid user ID format',
    'any.required': 'User IDs are required',
  }),
})
