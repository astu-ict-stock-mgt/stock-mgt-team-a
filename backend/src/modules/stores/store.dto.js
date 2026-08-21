const Joi = require('joi');

const createStoreSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('MAIN_STORE', 'DEPARTMENT_STORE', 'WAREHOUSE', 'TRANSIT_STORE', 'QUARANTINE_STORE').default('MAIN_STORE'),
  description: Joi.string().max(500).optional(),
  address: Joi.string().max(200).optional(),
  responsibleOfficerId: Joi.string().uuid().optional(),
});

const updateStoreSchema = Joi.object({
  code: Joi.string().max(20).optional(),
  name: Joi.string().max(100).optional(),
  type: Joi.string().valid('MAIN_STORE', 'DEPARTMENT_STORE', 'WAREHOUSE', 'TRANSIT_STORE', 'QUARANTINE_STORE').optional(),
  description: Joi.string().max(500).optional(),
  address: Joi.string().max(200).optional(),
  responsibleOfficerId: Joi.string().uuid().optional(),
}).min(1);

const updateStoreStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
});

module.exports = {
  createStoreSchema,
  updateStoreSchema,
  updateStoreStatusSchema,
};
