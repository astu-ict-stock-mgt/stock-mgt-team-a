/**
 * Template Service Reference
 * Task: BE-007
 */

import { findTemplateItems, createTemplateItem } from './template.repository.js'

export const getTemplates = async () => {
  return await findTemplateItems()
}

export const addTemplate = async (payload) => {
  return await createTemplateItem(payload)
}
