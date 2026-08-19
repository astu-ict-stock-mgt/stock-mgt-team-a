/**
 * Template Router Reference
 * Tasks: BE-007 & BE-014
 */

import { Router } from 'express'
import { listTemplates, postTemplate } from './template.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { createTemplateSchema } from './dto/template.dto.js'

const router = Router()

router.get('/template', listTemplates)
router.post('/template', validateRequest({ body: createTemplateSchema }), postTemplate)

export default router
