import unitService from './unit.service.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

class UnitController {
  async create(req, res, next) {
    try {
      const unit = await unitService.create(req.body);
      return sendSuccess(res, unit, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const units = await unitService.findAll(req.query);
      return sendSuccess(res, units);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const unit = await unitService.findById(req.params.id);
      return sendSuccess(res, unit);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req, res, next) {
    try {
      const unit = await unitService.update(req.params.id, req.body);
      return sendSuccess(res, unit);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const unit = await unitService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, unit);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async delete(req, res, next) {
    try {
      await unitService.delete(req.params.id);
      return sendSuccess(res, { message: 'Unit deleted successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new UnitController();
