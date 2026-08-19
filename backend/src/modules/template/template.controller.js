/**
 * Template Controller Reference
 * Task: BE-007
 */

import { getTemplates, addTemplate } from './template.service.js'
import { validateCreateTemplateDto } from './dto/template.dto.js'

export const listTemplates = async (req, res, next) => {
  try {
    const data = await getTemplates()
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export const postTemplate = async (req, res, next) => {
  try {
    const validation = validateCreateTemplateDto(req.body)
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors })
    }
    const created = await addTemplate(req.body)
    res.status(201).json({ success: true, data: created })
  } catch (err) {
    next(err)
  }
}
