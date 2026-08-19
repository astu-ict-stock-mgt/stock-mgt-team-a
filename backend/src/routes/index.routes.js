/**
 * Master Router Aggregator
 * Task: BE-007 (Establish Backend Folder/Domain Architecture)
 */

import { Router } from 'express'
import healthRoutes from '../modules/health/health.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import templateRoutes from '../modules/template/template.routes.js'

const router = Router()

router.use('/', healthRoutes)
router.use('/', authRoutes)
router.use('/', templateRoutes)

export default router
