import Joi from 'joi';

const createItemSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  categoryId: Joi.string().uuid().optional().allow(null),
  unitId: Joi.string().uuid().required(),
  supplierId: Joi.string().uuid().optional().allow(null),
  minimumStock: Joi.number().integer().min(0).optional(),
  maximumStock: Joi.number().integer().min(0).optional(),
  reorderPoint: Joi.number().integer().min(0).optional(),
  unitCost: Joi.number().positive().optional(),
  weight: Joi.string().max(50).optional(),
  dimensions: Joi.string().max(100).optional(),
  barcode: Joi.string().max(50).optional(),
});

const updateItemSchema = Joi.object({
  code: Joi.string().max(20).optional(),
  name: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  categoryId: Joi.string().uuid().optional().allow(null),
  unitId: Joi.string().uuid().optional(),
  supplierId: Joi.string().uuid().optional().allow(null),
  minimumStock: Joi.number().integer().min(0).optional(),
  maximumStock: Joi.number().integer().min(0).optional(),
  reorderPoint: Joi.number().integer().min(0).optional(),
  unitCost: Joi.number().positive().optional(),
  weight: Joi.string().max(50).optional(),
  dimensions: Joi.string().max(100).optional(),
  barcode: Joi.string().max(50).optional(),
}).min(1);

const updateItemStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DISCONTINUED').required(),
});

export {
  createItemSchema,
  updateItemSchema,
  updateItemStatusSchema,
};
