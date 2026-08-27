import { Router } from 'express';
import evaluationController from './evaluation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.EVALUATIONS_READ), evaluationController.findAll);
router.get('/:id', authorize(PERMISSIONS.EVALUATIONS_READ), evaluationController.findById);
router.post('/', authorize(PERMISSIONS.EVALUATIONS_CREATE), evaluationController.create);
router.patch('/:id/start', authorize(PERMISSIONS.EVALUATIONS_UPDATE), evaluationController.startEvaluation);
router.patch('/:id/decision', authorize(PERMISSIONS.EVALUATIONS_DECIDE), evaluationController.updateDecision);

export default router;
