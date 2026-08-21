import { Router } from 'express';
import departmentController from './department.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('departments.read'), departmentController.findAll);
router.get('/:id', authorize('departments.read'), departmentController.findById);
router.post('/', authorize('departments.create'), departmentController.create);
router.put('/:id', authorize('departments.update'), departmentController.update);
router.patch('/:id/status', authorize('departments.update'), departmentController.updateStatus);
router.delete('/:id', authorize('departments.delete'), departmentController.delete);
router.post('/:id/stores', authorize('departments.update'), departmentController.addStore);
router.delete('/:id/stores/:storeId', authorize('departments.update'), departmentController.removeStore);

export default router;
