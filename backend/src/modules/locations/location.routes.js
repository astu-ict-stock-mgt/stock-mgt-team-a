import { Router } from 'express';
import locationController from './location.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/hierarchy/:storeId', authorize('locations.read'), locationController.getHierarchy);
router.get('/', authorize('locations.read'), locationController.findAll);
router.get('/:id', authorize('locations.read'), locationController.findById);
router.post('/', authorize('locations.create'), locationController.create);
router.put('/:id', authorize('locations.update'), locationController.update);
router.patch('/:id/status', authorize('locations.update'), locationController.updateStatus);
router.delete('/:id', authorize('locations.delete'), locationController.delete);

export default router;
