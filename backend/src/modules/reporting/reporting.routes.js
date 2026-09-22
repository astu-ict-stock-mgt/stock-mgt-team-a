import { Router } from 'express';
import reportingController from './reporting.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);
router.use(authorize([PERMISSIONS.REPORTS_VIEW.key]));

router.get('/stock-levels', reportingController.getStockLevelsReport);
router.get('/stock-movement', reportingController.getStockMovementReport);
router.get('/valuation', reportingController.getValuationReport);

export default router;
