import { Router } from 'express';
import departmentController from './department.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.DEPARTMENTS_READ), departmentController.findAll);
router.get('/:id', authorize(PERMISSIONS.DEPARTMENTS_READ), departmentController.findById);
router.post('/', authorize(PERMISSIONS.DEPARTMENTS_MANAGE), departmentController.create);
router.put('/:id', authorize(PERMISSIONS.DEPARTMENTS_MANAGE), departmentController.update);
router.patch('/:id/status', authorize(PERMISSIONS.DEPARTMENTS_MANAGE), departmentController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.DEPARTMENTS_MANAGE), departmentController.delete);
router.post('/:id/stores', authorize(PERMISSIONS.DEPARTMENTS_MANAGE), departmentController.addStore);
router.delete('/:id/stores/:storeId', authorize(PERMISSIONS.DEPARTMENTS_MANAGE), departmentController.removeStore);

export default router;
