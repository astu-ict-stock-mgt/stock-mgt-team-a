/**
 * Template Controller Reference
 * Tasks: BE-007, BE-014, BE-016
 */

import { getTemplates, addTemplate } from './template.service.js'
import { sendCreated, sendPaginated } from '../../utils/response.js'

export const listTemplates = async (req, res, next) => {
  try {
    const data = await getTemplates()
    sendPaginated(res, data, 1, 10, data.length)
  } catch (err) {
    next(err)
  }
}

export const postTemplate = async (req, res, next) => {
  try {
    const created = await addTemplate(req.body)
    sendCreated(res, created)
  } catch (err) {
    next(err)
  }
}
