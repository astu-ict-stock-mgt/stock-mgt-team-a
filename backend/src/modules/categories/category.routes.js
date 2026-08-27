import { Router } from 'express';
import categoryController from './category.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/hierarchy', authorize(PERMISSIONS.CATEGORIES_READ), categoryController.getHierarchy);
router.get('/', authorize(PERMISSIONS.CATEGORIES_READ), categoryController.findAll);
router.get('/:id', authorize(PERMISSIONS.CATEGORIES_READ), categoryController.findById);
router.post('/', authorize(PERMISSIONS.CATEGORIES_MANAGE), categoryController.create);
router.put('/:id', authorize(PERMISSIONS.CATEGORIES_MANAGE), categoryController.update);
router.patch('/:id/status', authorize(PERMISSIONS.CATEGORIES_MANAGE), categoryController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.CATEGORIES_MANAGE), categoryController.delete);

export default router;
