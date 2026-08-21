import itemService from './item.service.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

class ItemController {
  async create(req, res, next) {
    try {
      const item = await itemService.create(req.body);
      return sendSuccess(res, item, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const items = await itemService.findAll(req.query);
      return sendSuccess(res, items);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const item = await itemService.findById(req.params.id);
      return sendSuccess(res, item);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req, res, next) {
    try {
      const item = await itemService.update(req.params.id, req.body);
      return sendSuccess(res, item);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const item = await itemService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, item);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async delete(req, res, next) {
    try {
      await itemService.delete(req.params.id);
      return sendSuccess(res, { message: 'Item deleted successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async search(req, res, next) {
    try {
      const items = await itemService.search(req.query.q);
      return sendSuccess(res, items);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new ItemController();
