import masterDataService from './master-data.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class MasterDataController {
  async search(req, res, next) {
    try {
      const { q, type, status, limit } = req.query;
      const results = await masterDataService.search(q, { type, status, limit: parseInt(limit) || 50 });
      return sendSuccess(res, results);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await masterDataService.getStats();
      return sendSuccess(res, stats);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new MasterDataController();
