import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import * as controller from './notifications.controller.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

router.use(authenticate)

router.get('/', authorize(PERMISSIONS.INVENTORY_READ), controller.list)
router.post('/', authorize(PERMISSIONS.INVENTORY_CREATE), controller.create)
router.post('/mark-all-read', authorize(PERMISSIONS.INVENTORY_READ), controller.markAllRead)
router.post('/trigger-expiry-check', authorize(PERMISSIONS.INVENTORY_UPDATE), controller.triggerExpiryCheck)
router.post('/trigger-low-stock-check', authorize(PERMISSIONS.INVENTORY_UPDATE), controller.triggerLowStockCheck)
router.post('/trigger-disposal-check', authorize(PERMISSIONS.INVENTORY_UPDATE), controller.triggerDisposalCheck)
router.post('/:id/read', authorize(PERMISSIONS.INVENTORY_READ), controller.markRead)
router.delete('/:id', authorize(PERMISSIONS.INVENTORY_READ), controller.remove)

export default router
