/**
 * Custom Domain Error Classes
 * Tasks: BE-015 & BE-027
 * SRS Traceability: Section 13 (Security Requirements), NFR-04, NFR-05
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null) {
    super(message, 400, 'BAD_REQUEST', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied: insufficient permissions') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate entry') {
    super(message, 409, 'CONFLICT')
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Input validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient stock for requested operation', details = null) {
    super(message, 409, 'INSUFFICIENT_STOCK', details)
  }
}

export class InvalidStatusError extends AppError {
  constructor(message = 'Document is not in an authorising state for this operation', details = null) {
    super(message, 422, 'INVALID_STATUS', details)
  }
}

export class InvalidDestinationError extends AppError {
  constructor(message = 'Destination store or location is invalid', details = null) {
    super(message, 422, 'INVALID_DESTINATION', details)
  }
}

export class InvalidSourceError extends AppError {
  constructor(message = 'Source store or location is invalid', details = null) {
    super(message, 422, 'INVALID_SOURCE', details)
  }
}

export class DuplicatePostingError extends AppError {
  constructor(message = 'Document has already been finalized/posted', details = null) {
    super(message, 409, 'DUPLICATE_POSTING', details)
  }
}

