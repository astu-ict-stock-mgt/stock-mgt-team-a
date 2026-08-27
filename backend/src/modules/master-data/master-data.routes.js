import { Router } from 'express';
import masterDataController from './master-data.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/search', authorize(PERMISSIONS.MASTER_DATA_READ), masterDataController.search);
router.get('/stats', authorize(PERMISSIONS.MASTER_DATA_READ), masterDataController.getStats);

export default router;
