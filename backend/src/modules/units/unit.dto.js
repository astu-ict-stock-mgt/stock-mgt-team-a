import Joi from 'joi';

const createUnitSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  symbol: Joi.string().max(10).required(),
  conversionFactor: Joi.number().positive().optional(),
  description: Joi.string().max(500).optional(),
});

const updateUnitSchema = Joi.object({
  code: Joi.string().max(20).optional(),
  name: Joi.string().max(100).optional(),
  symbol: Joi.string().max(10).optional(),
  conversionFactor: Joi.number().positive().optional(),
  description: Joi.string().max(500).optional(),
}).min(1);

const updateUnitStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
});

export {
  createUnitSchema,
  updateUnitSchema,
  updateUnitStatusSchema,
};
