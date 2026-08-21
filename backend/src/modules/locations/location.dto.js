import Joi from 'joi';

const createLocationSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('STORE', 'AREA', 'SHELF', 'RACK', 'BIN').default('BIN'),
  storeId: Joi.string().uuid().required(),
  parentId: Joi.string().uuid().optional().allow(null),
  capacity: Joi.number().integer().min(0).optional(),
  description: Joi.string().max(500).optional(),
});

const updateLocationSchema = Joi.object({
  code: Joi.string().max(20).optional(),
  name: Joi.string().max(100).optional(),
  type: Joi.string().valid('STORE', 'AREA', 'SHELF', 'RACK', 'BIN').optional(),
  parentId: Joi.string().uuid().optional().allow(null),
  capacity: Joi.number().integer().min(0).optional(),
  description: Joi.string().max(500).optional(),
}).min(1);

const updateLocationStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
});

export {
  createLocationSchema,
  updateLocationSchema,
  updateLocationStatusSchema,
};
