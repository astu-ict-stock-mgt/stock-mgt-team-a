import { Router } from 'express';
import inventoryController from './inventory.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// Transaction Posting
router.post('/transactions', authorize('inventory.post'), inventoryController.postTransaction);
router.get('/transactions/history', authorize('inventory.read'), inventoryController.getTransactionHistory);

// Stock Balance
router.get('/stock/:itemId/:storeId', authorize('inventory.read'), inventoryController.getStockBalance);
router.get('/stock/store/:storeId', authorize('inventory.read'), inventoryController.getStockByStore);
router.get('/stock/item/:itemId', authorize('inventory.read'), inventoryController.getStockByItem);
router.get('/stock/value/:storeId', authorize('inventory.read'), inventoryController.getStockValue);
router.get('/stock/low/:storeId', authorize('inventory.read'), inventoryController.getLowStockItems);

// Bin Balance
router.get('/bin/:itemId/:locationId', authorize('inventory.read'), inventoryController.getBinBalance);

// Movement Summary
router.get('/movements/:storeId', authorize('inventory.read'), inventoryController.getMovementSummary);

export default router;
