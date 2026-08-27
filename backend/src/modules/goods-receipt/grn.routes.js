import { Router } from 'express';
import grnController from './grn.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.GRN_READ), grnController.findAll);
router.get('/:id', authorize(PERMISSIONS.GRN_READ), grnController.findById);
router.post('/', authorize(PERMISSIONS.GRN_GENERATE), grnController.create);
router.patch('/:id/finalize', authorize(PERMISSIONS.GRN_GENERATE), grnController.finalize);
router.patch('/:id/cancel', authorize(PERMISSIONS.GRN_CANCEL), grnController.cancel);

export default router;
