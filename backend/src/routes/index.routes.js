/**
 * Master Router Aggregator
 * Task: BE-006
 */

import { Router } from 'express'
import healthRoutes from './health.routes.js'
import rbacRoutes from './rbac.routes.js'

const router = Router()

router.use('/', healthRoutes)
router.use('/', rbacRoutes)

export default router
