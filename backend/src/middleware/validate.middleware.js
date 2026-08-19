/**
 * Central Request Validation Middleware Layer (Zod)
 * Task: BE-014 (Implement Request Validation Layer)
 * SRS Traceability: Section 13 (Security), NFR-06 (Usability)
 */

/**
 * Validate incoming request targets (body, query, params) against Zod schemas.
 * @param {Object} schemas - Object containing optional body, query, params Zod schemas
 * @returns {Function} Express middleware handler
 */
export const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query)
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params)
      }
      next()
    } catch (err) {
      if (err.name === 'ZodError') {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        }))

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details,
          },
        })
      }
      next(err)
    }
  }
}
