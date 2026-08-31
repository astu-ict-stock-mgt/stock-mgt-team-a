import reportingService from './reporting.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class ReportingController {
  async getStockLevelsReport(req, res) {
    try {
      const report = await reportingService.getStockLevelsReport(req.query);
      return sendSuccess(res, report);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getStockMovementReport(req, res) {
    try {
      const report = await reportingService.getStockMovementReport(req.query);
      return sendSuccess(res, report);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getValuationReport(req, res) {
    try {
      const report = await reportingService.getValuationReport(req.query);
      return sendSuccess(res, report);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new ReportingController();
