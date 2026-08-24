import storeService from './store.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class StoreController {
  async create(req, res, next) {
    try {
      const store = await storeService.create(req.body);
      return sendSuccess(res, store, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const stores = await storeService.findAll(req.query);
      return sendSuccess(res, stores);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const store = await storeService.findById(req.params.id);
      return sendSuccess(res, store);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req, res, next) {
    try {
      const store = await storeService.update(req.params.id, req.body);
      return sendSuccess(res, store);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const store = await storeService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, store);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async delete(req, res, next) {
    try {
      await storeService.delete(req.params.id);
      return sendSuccess(res, { message: 'Store deleted successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new StoreController();
