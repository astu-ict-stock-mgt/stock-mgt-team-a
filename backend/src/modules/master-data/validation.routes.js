import { Router } from 'express';
import validationController from './validation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.post('/validate-code', authorize(PERMISSIONS.MASTER_DATA_VALIDATE), validationController.validateCode);
router.post('/validate-stock', authorize(PERMISSIONS.MASTER_DATA_VALIDATE), validationController.validateStockLevels);
router.post('/validate-hierarchy', authorize(PERMISSIONS.MASTER_DATA_VALIDATE), validationController.validateHierarchy);

export default router;
