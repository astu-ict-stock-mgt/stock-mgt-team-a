import { Router } from 'express';
import unitController from './unit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.UNITS_READ), unitController.findAll);
router.get('/:id', authorize(PERMISSIONS.UNITS_READ), unitController.findById);
router.post('/', authorize(PERMISSIONS.UNITS_MANAGE), unitController.create);
router.put('/:id', authorize(PERMISSIONS.UNITS_MANAGE), unitController.update);
router.patch('/:id/status', authorize(PERMISSIONS.UNITS_MANAGE), unitController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.UNITS_MANAGE), unitController.delete);

export default router;
