import { Router } from 'express';
import reportingController from './reporting.controller.js';
import { requireAuth, requirePermissions } from '../../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermissions([PERMISSIONS.REPORTS_VIEW.key]));

router.get('/stock-levels', reportingController.getStockLevelsReport);
router.get('/stock-movement', reportingController.getStockMovementReport);
router.get('/valuation', reportingController.getValuationReport);

export default router;
