import { Router } from 'express';
import evaluationController from './evaluation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('evaluation.read'), evaluationController.findAll);
router.get('/:id', authorize('evaluation.read'), evaluationController.findById);
router.post('/', authorize('evaluation.create'), evaluationController.create);
router.patch('/:id/start', authorize('evaluation.update'), evaluationController.startEvaluation);
router.patch('/:id/decision', authorize('evaluation.update'), evaluationController.updateDecision);

export default router;
