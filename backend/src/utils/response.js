/**
 * Standard API Response Envelope & HTTP Status Helper Module
 * Tasks: BE-016 & BE-028
 * SRS Traceability: NFR-06 (Usability)
 */

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
})

export const sendSuccess = (res, data, statusCode = HTTP_STATUS.OK, meta = null) => {
  const payload = {
    success: true,
    data,
    ...(meta && { meta }),
  }
  return res.status(statusCode).json(payload)
}

export const sendCreated = (res, data, meta = null) => {
  return sendSuccess(res, data, HTTP_STATUS.CREATED, meta)
}

export const sendPaginated = (res, data, page, limit, totalItems) => {
  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const totalPages = Math.ceil(totalItems / limitNum) || 1

  const meta = {
    page: pageNum,
    limit: limitNum,
    totalItems,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  }

  return sendSuccess(res, data, HTTP_STATUS.OK, meta)
}

export const sendError = (
  res,
  message,
  statusCode = HTTP_STATUS.BAD_REQUEST,
  code = 'BAD_REQUEST',
  details = null
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  })
}
