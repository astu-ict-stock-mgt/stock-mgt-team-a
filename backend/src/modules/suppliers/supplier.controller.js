import supplierService from './supplier.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class SupplierController {
  async create(req, res, next) {
    try {
      const supplier = await supplierService.create(req.body);
      return sendSuccess(res, supplier, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const suppliers = await supplierService.findAll(req.query);
      return sendSuccess(res, suppliers);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const supplier = await supplierService.findById(req.params.id);
      return sendSuccess(res, supplier);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req, res, next) {
    try {
      const supplier = await supplierService.update(req.params.id, req.body);
      return sendSuccess(res, supplier);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const supplier = await supplierService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, supplier);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async delete(req, res, next) {
    try {
      await supplierService.delete(req.params.id);
      return sendSuccess(res, { message: 'Supplier deleted successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new SupplierController();
