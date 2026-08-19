/**
 * Template Router Reference
 * Task: BE-007
 */

import { Router } from 'express'
import { listTemplates, postTemplate } from './template.controller.js'

const router = Router()

router.get('/template', listTemplates)
router.post('/template', postTemplate)

export default router
