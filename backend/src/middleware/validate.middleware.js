/**
 * Central Request Validation Middleware Layer
 * Task: BE-014 (Implement Request Validation Layer)
 * SRS Traceability: Section 13 (Security), NFR-06 (Usability)
 * Supports both Zod and Joi schemas.
 */

export const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await validate(schemas.body, req.body)
      }
      if (schemas.query) {
        req.query = await validate(schemas.query, req.query)
      }
      if (schemas.params) {
        req.params = await validate(schemas.params, req.params)
      }
      next()
    } catch (err) {
      if (err.isJoi || err.name === 'ZodError') {
        const details = err.isJoi
          ? err.details.map(d => ({ field: d.path.join('.') || 'body', message: d.message }))
          : err.issues.map(i => ({ field: i.path.join('.') || 'body', message: i.message }))

        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Input validation failed', details },
        })
      }
      next(err)
    }
  }
}

async function validate(schema, data) {
  // Zod schema
  if (typeof schema.parseAsync === 'function') {
    return schema.parseAsync(data)
  }
  // Joi schema
  if (typeof schema.validateAsync === 'function') {
    return schema.validateAsync(data)
  }
  throw new Error('Unknown schema type: must be Zod or Joi')
}
