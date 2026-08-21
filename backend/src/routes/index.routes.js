/**
 * Master Router Aggregator
 * Tasks: BE-006 & BE-028 (Auth Routes Integration)
 */

import { Router } from 'express'
import healthRoutes from './health.routes.js'
import rbacRoutes from './rbac.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import { storeRoutes } from '../modules/stores/index.js'
import { departmentRoutes } from '../modules/departments/index.js'

const router = Router()

router.use('/', healthRoutes)
router.use('/', rbacRoutes)
router.use('/auth', authRoutes)
router.use('/stores', storeRoutes)
router.use('/departments', departmentRoutes)

export default router
