/**
 * Template DTO (Data Transfer Object) Reference
 * Task: BE-007 (Developer Reference Boilerplate)
 */

export const validateCreateTemplateDto = (payload) => {
  const errors = []
  if (!payload || !payload.title) {
    errors.push('title is required')
  }
  return {
    isValid: errors.length === 0,
    errors,
  }
}
