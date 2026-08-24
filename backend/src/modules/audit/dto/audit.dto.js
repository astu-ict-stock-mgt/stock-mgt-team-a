/**
 * Authentication Audit Events DTOs (Data Transfer Objects)
 * Task: BE-039 (Authentication Audit Events)
 * SRS Traceability: Section 13 (Security Requirements)
 */

import Joi from 'joi'
import { AUDIT_EVENT_TYPES } from '../audit.service.js'

/**
 * Create Audit Event Schema
 */
export const createAuditEventSchema = Joi.object({
  eventType: Joi.string()
    .valid(...Object.values(AUDIT_EVENT_TYPES))
    .required()
    .messages({
      'any.only': 'Invalid event type',
      'any.required': 'Event type is required',
    }),
  userId: Joi.string().uuid().optional().allow(null, '').messages({
    'string.uuid': 'Invalid user ID format',
  }),
  details: Joi.string().max(1000).optional().allow(null, '').messages({
    'string.max': 'Details must not exceed 1000 characters',
  }),
  ipAddress: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).optional().allow(null, '').messages({
    'string.ip': 'Invalid IP address format',
  }),
  userAgent: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'User agent must not exceed 500 characters',
  }),
})

/**
 * Delete Old Events Schema
 */
export const deleteOldEventsSchema = Joi.object({
  daysOld: Joi.number().integer().min(1).max(365).optional().default(90).messages({
    'number.base': 'Days old must be a number',
    'number.integer': 'Days old must be an integer',
    'number.min': 'Days old must be at least 1',
    'number.max': 'Days old must not exceed 365',
  }),
})
