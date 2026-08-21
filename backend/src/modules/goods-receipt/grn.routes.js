import { Router } from 'express';
import grnController from './grn.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('grn.read'), grnController.findAll);
router.get('/:id', authorize('grn.read'), grnController.findById);
router.post('/', authorize('grn.create'), grnController.create);
router.patch('/:id/finalize', authorize('grn.update'), grnController.finalize);
router.patch('/:id/cancel', authorize('grn.update'), grnController.cancel);

export default router;
