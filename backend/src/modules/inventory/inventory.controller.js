import transactionPostingService from './transaction-posting.service.js';
import inventoryLedgerService from './inventory-ledger.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class InventoryController {
  async postTransaction(req, res, next) {
    try {
      const result = await transactionPostingService.postTransaction({
        ...req.body,
        createdBy: req.user.userId,
      });
      return sendSuccess(res, result, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getStockBalance(req, res, next) {
    try {
      const { itemId, storeId } = req.params;
      const balance = await transactionPostingService.getStockBalance(itemId, storeId);
      return sendSuccess(res, balance);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getBinBalance(req, res, next) {
    try {
      const { itemId, locationId } = req.params;
      const balance = await transactionPostingService.getBinBalance(itemId, locationId);
      return sendSuccess(res, balance);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getTransactionHistory(req, res, next) {
    try {
      const transactions = await transactionPostingService.getTransactionHistory(req.query);
      return sendSuccess(res, transactions);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getStockByStore(req, res, next) {
    try {
      const stock = await inventoryLedgerService.getStockByStore(req.params.storeId, req.query);
      return sendSuccess(res, stock);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getStockByItem(req, res, next) {
    try {
      const stock = await inventoryLedgerService.getStockByItem(req.params.itemId);
      return sendSuccess(res, stock);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getStockValue(req, res, next) {
    try {
      const value = await inventoryLedgerService.getStockValue(req.params.storeId);
      return sendSuccess(res, value);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getLowStockItems(req, res, next) {
    try {
      const items = await inventoryLedgerService.getLowStockItems(req.params.storeId);
      return sendSuccess(res, items);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getMovementSummary(req, res, next) {
    try {
      const { storeId } = req.params;
      const { startDate, endDate } = req.query;
      const summary = await inventoryLedgerService.getMovementSummary(storeId, startDate, endDate);
      return sendSuccess(res, summary);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new InventoryController();
