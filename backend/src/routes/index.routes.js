/**
 * Master Router Aggregator
<<<<<<< HEAD
 * Tasks: BE-006, BE-028, BE-099, BE-106 (Preliminary SIV/ISIV API)
=======
 * Tasks: BE-006, BE-028, BE-099, BE-106, BE-117, BE-124, BE-130, BE-134 (Shelf-Life APIs)
>>>>>>> origin/main
 */

import { Router } from 'express'
import healthRoutes from './health.routes.js'
import rbacRoutes from './rbac.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import { storeRoutes } from '../modules/stores/index.js'
import { departmentRoutes } from '../modules/departments/index.js'
import { categoryRoutes } from '../modules/categories/index.js'
import { unitRoutes } from '../modules/units/index.js'
import { itemRoutes } from '../modules/items/index.js'
import { supplierRoutes } from '../modules/suppliers/index.js'
import { locationRoutes } from '../modules/locations/index.js'
import { masterDataRoutes, validationRoutes } from '../modules/master-data/index.js'
import { goodsReceiptRoutes, evaluationRoutes, grnRoutes } from '../modules/goods-receipt/index.js'
import { inventoryRoutes } from '../modules/inventory/index.js'
import requisitionRoutes from '../modules/requisitions/requisition.routes.js'
import sivRoutes from '../modules/siv/siv.routes.js'
<<<<<<< HEAD
import disposalRoutes from '../modules/disposal/disposal.routes.js'
=======
import returnRoutes from '../modules/returns/return.routes.js'
import transferRoutes from '../modules/transfers/transfer.routes.js'
import assetRoutes from '../modules/assets/asset.routes.js'
import shelflifeRoutes from '../modules/shelflife/shelflife.routes.js'
>>>>>>> origin/main

const router = Router()

router.use('/', healthRoutes)
router.use('/', rbacRoutes)
router.use('/auth', authRoutes)
router.use('/stores', storeRoutes)
router.use('/departments', departmentRoutes)
router.use('/categories', categoryRoutes)
router.use('/units', unitRoutes)
router.use('/items', itemRoutes)
router.use('/suppliers', supplierRoutes)
router.use('/locations', locationRoutes)
router.use('/master-data', masterDataRoutes)
router.use('/validation', validationRoutes)
router.use('/goods-receipts', goodsReceiptRoutes)
router.use('/evaluations', evaluationRoutes)
router.use('/grns', grnRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/requisitions', requisitionRoutes)
router.use('/sivs', sivRoutes)
<<<<<<< HEAD
router.use('/disposal-requests', disposalRoutes)
router.use('/disposal', disposalRoutes)
=======
router.use('/returns', returnRoutes)
router.use('/transfers', transferRoutes)
router.use('/assets', assetRoutes)
router.use('/shelflife', shelflifeRoutes)
>>>>>>> origin/main

export default router
