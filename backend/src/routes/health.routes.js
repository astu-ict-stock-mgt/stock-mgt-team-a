/**
 * Health Check Routes
 * Task: BE-006
 */

import { Router } from 'express'
import { getHealth } from '../controllers/health.controller.js'

const router = Router()

router.get('/health', getHealth)

export default router
