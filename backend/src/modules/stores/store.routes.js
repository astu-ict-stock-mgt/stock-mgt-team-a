import { Router } from 'express';
import storeController from './store.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.STORES_READ), storeController.findAll);
router.get('/:id', authorize(PERMISSIONS.STORES_READ), storeController.findById);
router.post('/', authorize(PERMISSIONS.STORES_MANAGE), storeController.create);
router.put('/:id', authorize(PERMISSIONS.STORES_MANAGE), storeController.update);
router.patch('/:id/status', authorize(PERMISSIONS.STORES_MANAGE), storeController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.STORES_MANAGE), storeController.delete);

export default router;
