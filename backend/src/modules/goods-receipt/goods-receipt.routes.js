import { Router } from 'express';
import goodsReceiptController from './goods-receipt.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('goods-receipt.read'), goodsReceiptController.findAll);
router.get('/:id', authorize('goods-receipt.read'), goodsReceiptController.findById);
router.post('/', authorize('goods-receipt.create'), goodsReceiptController.create);
router.patch('/:id/status', authorize('goods-receipt.update'), goodsReceiptController.updateStatus);

export default router;
