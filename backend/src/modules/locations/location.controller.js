import locationService from './location.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class LocationController {
  async create(req, res, next) {
    try {
      const location = await locationService.create(req.body);
      return sendSuccess(res, location, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const locations = await locationService.findAll(req.query);
      return sendSuccess(res, locations);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const location = await locationService.findById(req.params.id);
      return sendSuccess(res, location);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req, res, next) {
    try {
      const location = await locationService.update(req.params.id, req.body);
      return sendSuccess(res, location);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const location = await locationService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, location);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async delete(req, res, next) {
    try {
      await locationService.delete(req.params.id);
      return sendSuccess(res, { message: 'Location deleted successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getHierarchy(req, res, next) {
    try {
      const hierarchy = await locationService.getHierarchy(req.params.storeId);
      return sendSuccess(res, hierarchy);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new LocationController();
