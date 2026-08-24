import { Router } from 'express';
import masterDataController from './master-data.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/search', authorize('master-data.read'), masterDataController.search);
router.get('/stats', authorize('master-data.read'), masterDataController.getStats);

export default router;
