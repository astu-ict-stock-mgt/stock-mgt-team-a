import Joi from 'joi';

const createDepartmentSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  headUserId: Joi.string().uuid().optional(),
});

const updateDepartmentSchema = Joi.object({
  code: Joi.string().max(20).optional(),
  name: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  headUserId: Joi.string().uuid().optional(),
}).min(1);

const updateDepartmentStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
});

const addStoreSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
  isPrimary: Joi.boolean().default(false),
});

export {
  createDepartmentSchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
  addStoreSchema,
};
