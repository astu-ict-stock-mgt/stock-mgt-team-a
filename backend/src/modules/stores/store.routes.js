import { Router } from 'express';
import storeController from './store.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('stores.read'), storeController.findAll);
router.get('/:id', authorize('stores.read'), storeController.findById);
router.post('/', authorize('stores.create'), storeController.create);
router.put('/:id', authorize('stores.update'), storeController.update);
router.patch('/:id/status', authorize('stores.update'), storeController.updateStatus);
router.delete('/:id', authorize('stores.delete'), storeController.delete);

export default router;
