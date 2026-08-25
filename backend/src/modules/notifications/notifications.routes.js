import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import * as controller from './notifications.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.list)
router.post('/', authorize(['inventory.create']), controller.create)
router.post('/mark-all-read', controller.markAllRead)
router.post('/trigger-expiry-check', authorize(['inventory.update']), controller.triggerExpiryCheck)
router.post('/trigger-low-stock-check', authorize(['inventory.update']), controller.triggerLowStockCheck)
router.post('/trigger-disposal-check', authorize(['inventory.update']), controller.triggerDisposalCheck)
router.post('/:id/read', controller.markRead)
router.delete('/:id', controller.remove)

export default router
