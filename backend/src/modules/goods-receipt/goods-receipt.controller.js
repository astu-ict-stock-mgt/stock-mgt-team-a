import goodsReceiptService from './goods-receipt.service.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

class GoodsReceiptController {
  async create(req, res, next) {
    try {
      const receipt = await goodsReceiptService.create(req.body, req.user.id);
      return sendSuccess(res, receipt, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const receipts = await goodsReceiptService.findAll(req.query);
      return sendSuccess(res, receipts);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const receipt = await goodsReceiptService.findById(req.params.id);
      return sendSuccess(res, receipt);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const receipt = await goodsReceiptService.updateStatus(
        req.params.id,
        req.body.status,
        req.user.id
      );
      return sendSuccess(res, receipt);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new GoodsReceiptController();
