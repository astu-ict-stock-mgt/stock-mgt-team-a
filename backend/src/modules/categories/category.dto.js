import Joi from 'joi';

const createCategorySchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  parentId: Joi.string().uuid().optional().allow(null),
  description: Joi.string().max(500).optional(),
});

const updateCategorySchema = Joi.object({
  code: Joi.string().max(20).optional(),
  name: Joi.string().max(100).optional(),
  parentId: Joi.string().uuid().optional().allow(null),
  description: Joi.string().max(500).optional(),
}).min(1);

const updateCategoryStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
});

export {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
};
