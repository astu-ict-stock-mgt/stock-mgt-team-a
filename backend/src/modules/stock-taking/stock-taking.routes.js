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

const router = Router()

router.use(authenticate)

router.get('/', validateRequest(stockTakeQuerySchema, 'query'), controller.list)
router.get('/:id', controller.getById)
router.get('/:id/variance-summary', controller.varianceSummary)

router.post('/', authorize(['inventory.create']), validateRequest(createStockTakeSchema), controller.create)
router.post('/:id/start', authorize(['inventory.update']), controller.start)
router.post('/:id/record-count', authorize(['inventory.update']), validateRequest(recordCountSchema), controller.recordCount)
router.post('/:id/complete', authorize(['inventory.update']), controller.complete)
router.post('/:id/reconcile', authorize(['inventory.update']), controller.reconcile)

export default router
