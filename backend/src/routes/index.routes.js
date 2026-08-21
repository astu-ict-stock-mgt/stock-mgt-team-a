/**
 * Master Router Aggregator
 * Tasks: BE-006, BE-028, BE-099 (Requisition Create API)
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

export default router
