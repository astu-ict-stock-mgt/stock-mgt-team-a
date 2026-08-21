import { Router } from 'express';
import unitController from './unit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('units.read'), unitController.findAll);
router.get('/:id', authorize('units.read'), unitController.findById);
router.post('/', authorize('units.create'), unitController.create);
router.put('/:id', authorize('units.update'), unitController.update);
router.patch('/:id/status', authorize('units.update'), unitController.updateStatus);
router.delete('/:id', authorize('units.delete'), unitController.delete);

export default router;
