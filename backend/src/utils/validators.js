/**
 * Common Validation Helpers
 * Tasks: BE-015, BE-027
 * SRS Traceability: Section 11 (Data Validation), NFR-04
 */

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export const isPositiveInteger = (value) => {
  const num = Number(value)
  return Number.isInteger(num) && num > 0
}

export const isNonNegativeInteger = (value) => {
  const num = Number(value)
  return Number.isInteger(num) && num >= 0
}

export const isValidString = (value, minLength = 1, maxLength = 255) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return trimmed.length >= minLength && trimmed.length <= maxLength
}

export const isValidDate = (dateString) => {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

export const isFutureDate = (dateString) => {
  const date = new Date(dateString)
  return date.getTime() > Date.now()
}

export const isValidStatus = (status, allowedStatuses) => {
  return allowedStatuses.includes(status)
}

export const sanitizeString = (value) => {
  if (typeof value !== 'string') return value
  return value.trim().replace(/\s+/g, ' ')
}

export const validatePagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10))
  const offset = (pageNum - 1) * limitNum
  return { page: pageNum, limit: limitNum, offset }
}

export const validateSortParams = (sortBy, sortOrder, allowedFields) => {
  const field = allowedFields.includes(sortBy) ? sortBy : allowedFields[0]
  const order = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'asc'
  return { sortBy: field, sortOrder: order }
}
