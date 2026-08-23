import categoryService from './category.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class CategoryController {
  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body);
      return sendSuccess(res, category, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const categories = await categoryService.findAll(req.query);
      return sendSuccess(res, categories);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const category = await categoryService.findById(req.params.id);
      return sendSuccess(res, category);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.update(req.params.id, req.body);
      return sendSuccess(res, category);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const category = await categoryService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, category);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async delete(req, res, next) {
    try {
      await categoryService.delete(req.params.id);
      return sendSuccess(res, { message: 'Category deleted successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getHierarchy(req, res, next) {
    try {
      const hierarchy = await categoryService.getHierarchy();
      return sendSuccess(res, hierarchy);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new CategoryController();
