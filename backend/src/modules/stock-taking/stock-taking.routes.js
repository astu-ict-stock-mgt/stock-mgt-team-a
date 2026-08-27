import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import * as controller from './stock-taking.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import {
  createStockTakeSchema,
  recordCountSchema,
  stockTakeQuerySchema,
} from './dto/stock-taking.dto.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

router.use(authenticate)

router.get('/', authorize(PERMISSIONS.RECONCILIATION_READ), validateRequest(stockTakeQuerySchema, 'query'), controller.list)
router.get('/:id', authorize(PERMISSIONS.RECONCILIATION_READ), controller.getById)
router.get('/:id/variance-summary', authorize(PERMISSIONS.RECONCILIATION_READ), controller.varianceSummary)

router.post('/', authorize(PERMISSIONS.RECONCILIATION_CREATE), validateRequest(createStockTakeSchema), controller.create)
router.post('/:id/start', authorize(PERMISSIONS.RECONCILIATION_CREATE), controller.start)
router.post('/:id/record-count', authorize(PERMISSIONS.RECONCILIATION_CREATE), validateRequest(recordCountSchema), controller.recordCount)
router.post('/:id/complete', authorize(PERMISSIONS.RECONCILIATION_CREATE), controller.complete)
router.post('/:id/reconcile', authorize(PERMISSIONS.RECONCILIATION_POST), controller.reconcile)

export default router
