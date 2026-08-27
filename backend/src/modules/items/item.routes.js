import { Router } from 'express';
import itemController from './item.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/search', authorize(PERMISSIONS.ITEMS_READ), itemController.search);
router.get('/', authorize(PERMISSIONS.ITEMS_READ), itemController.findAll);
router.get('/:id', authorize(PERMISSIONS.ITEMS_READ), itemController.findById);
router.post('/', authorize(PERMISSIONS.ITEMS_MANAGE), itemController.create);
router.put('/:id', authorize(PERMISSIONS.ITEMS_MANAGE), itemController.update);
router.patch('/:id/status', authorize(PERMISSIONS.ITEMS_MANAGE), itemController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.ITEMS_MANAGE), itemController.delete);

export default router;
