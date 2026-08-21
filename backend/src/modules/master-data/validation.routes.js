import { Router } from 'express';
import validationController from './validation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/validate-code', authorize('master-data.validate'), validationController.validateCode);
router.post('/validate-stock', authorize('master-data.validate'), validationController.validateStockLevels);
router.post('/validate-hierarchy', authorize('master-data.validate'), validationController.validateHierarchy);

export default router;
