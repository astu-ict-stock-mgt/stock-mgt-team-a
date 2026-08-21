import { Router } from 'express';
import itemController from './item.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/search', authorize('items.read'), itemController.search);
router.get('/', authorize('items.read'), itemController.findAll);
router.get('/:id', authorize('items.read'), itemController.findById);
router.post('/', authorize('items.create'), itemController.create);
router.put('/:id', authorize('items.update'), itemController.update);
router.patch('/:id/status', authorize('items.update'), itemController.updateStatus);
router.delete('/:id', authorize('items.delete'), itemController.delete);

export default router;
