import { Router } from 'express';
import locationController from './location.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/hierarchy/:storeId', authorize(PERMISSIONS.LOCATIONS_READ), locationController.getHierarchy);
router.get('/', authorize(PERMISSIONS.LOCATIONS_READ), locationController.findAll);
router.get('/:id', authorize(PERMISSIONS.LOCATIONS_READ), locationController.findById);
router.post('/', authorize(PERMISSIONS.LOCATIONS_MANAGE), locationController.create);
router.put('/:id', authorize(PERMISSIONS.LOCATIONS_MANAGE), locationController.update);
router.patch('/:id/status', authorize(PERMISSIONS.LOCATIONS_MANAGE), locationController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.LOCATIONS_MANAGE), locationController.delete);

export default router;
