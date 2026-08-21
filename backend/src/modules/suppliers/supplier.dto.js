import Joi from 'joi';

const createSupplierSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('COMPANY', 'DONOR', 'GOVERNMENT', 'NGO').default('COMPANY'),
  contactPerson: Joi.string().max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(20).optional(),
  address: Joi.string().max(200).optional(),
  taxId: Joi.string().max(50).optional(),
  paymentTerms: Joi.string().max(100).optional(),
  leadTimeDays: Joi.number().integer().min(0).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  notes: Joi.string().max(500).optional(),
});

const updateSupplierSchema = Joi.object({
  code: Joi.string().max(20).optional(),
  name: Joi.string().max(100).optional(),
  type: Joi.string().valid('COMPANY', 'DONOR', 'GOVERNMENT', 'NGO').optional(),
  contactPerson: Joi.string().max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(20).optional(),
  address: Joi.string().max(200).optional(),
  taxId: Joi.string().max(50).optional(),
  paymentTerms: Joi.string().max(100).optional(),
  leadTimeDays: Joi.number().integer().min(0).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  notes: Joi.string().max(500).optional(),
}).min(1);

const updateSupplierStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required(),
});

export {
  createSupplierSchema,
  updateSupplierSchema,
  updateSupplierStatusSchema,
};
