/**
 * Health Check Domain Routes
 * Task: BE-007
 */

import { Router } from 'express'
import { getHealth } from './health.controller.js'

const router = Router()

router.get('/health', getHealth)

export default router
