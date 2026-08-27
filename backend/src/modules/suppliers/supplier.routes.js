import { Router } from 'express';
import supplierController from './supplier.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SUPPLIERS_READ), supplierController.findAll);
router.get('/:id', authorize(PERMISSIONS.SUPPLIERS_READ), supplierController.findById);
router.post('/', authorize(PERMISSIONS.SUPPLIERS_MANAGE), supplierController.create);
router.put('/:id', authorize(PERMISSIONS.SUPPLIERS_MANAGE), supplierController.update);
router.patch('/:id/status', authorize(PERMISSIONS.SUPPLIERS_MANAGE), supplierController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.SUPPLIERS_MANAGE), supplierController.delete);

export default router;
