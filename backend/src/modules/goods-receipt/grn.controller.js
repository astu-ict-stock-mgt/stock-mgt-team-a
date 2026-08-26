import grnService from './grn.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class GRNController {
  async create(req, res, next) {
    try {
      const grn = await grnService.create(req.body, req.user.userId);
      return sendSuccess(res, grn, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const grns = await grnService.findAll(req.query);
      return sendSuccess(res, grns);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const grn = await grnService.findById(req.params.id);
      return sendSuccess(res, grn);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async finalize(req, res, next) {
    try {
      const grn = await grnService.finalize(req.params.id, req.user.userId);
      return sendSuccess(res, grn);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async cancel(req, res, next) {
    try {
      const grn = await grnService.cancel(req.params.id);
      return sendSuccess(res, grn);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new GRNController();
