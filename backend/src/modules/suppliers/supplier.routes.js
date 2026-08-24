import { Router } from 'express';
import supplierController from './supplier.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('suppliers.read'), supplierController.findAll);
router.get('/:id', authorize('suppliers.read'), supplierController.findById);
router.post('/', authorize('suppliers.create'), supplierController.create);
router.put('/:id', authorize('suppliers.update'), supplierController.update);
router.patch('/:id/status', authorize('suppliers.update'), supplierController.updateStatus);
router.delete('/:id', authorize('suppliers.delete'), supplierController.delete);

export default router;
