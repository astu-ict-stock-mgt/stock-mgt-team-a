/**
 * Template Controller Reference
 * Tasks: BE-007 & BE-014
 */

import { getTemplates, addTemplate } from './template.service.js'

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
    const created = await addTemplate(req.body)
    res.status(201).json({ success: true, data: created })
  } catch (err) {
    next(err)
  }
}
