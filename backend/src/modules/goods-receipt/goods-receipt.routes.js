import { Router } from 'express';
import goodsReceiptController from './goods-receipt.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.GOODS_RECEIPT_READ), goodsReceiptController.findAll);
router.get('/:id', authorize(PERMISSIONS.GOODS_RECEIPT_READ), goodsReceiptController.findById);
router.post('/', authorize(PERMISSIONS.GOODS_RECEIPT_CREATE), goodsReceiptController.create);
router.patch('/:id/status', authorize(PERMISSIONS.GOODS_RECEIPT_UPDATE), goodsReceiptController.updateStatus);

export default router;
