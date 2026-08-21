import { Router } from 'express';
import categoryController from './category.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/hierarchy', authorize('categories.read'), categoryController.getHierarchy);
router.get('/', authorize('categories.read'), categoryController.findAll);
router.get('/:id', authorize('categories.read'), categoryController.findById);
router.post('/', authorize('categories.create'), categoryController.create);
router.put('/:id', authorize('categories.update'), categoryController.update);
router.patch('/:id/status', authorize('categories.update'), categoryController.updateStatus);
router.delete('/:id', authorize('categories.delete'), categoryController.delete);

export default router;
