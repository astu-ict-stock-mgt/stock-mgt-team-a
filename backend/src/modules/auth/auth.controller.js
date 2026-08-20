/**
 * Auth & User Domain Controller
 * Tasks: BE-007, BE-016, BE-028 (Implement Login API)
 */

import { fetchRoles, fetchPermissions, fetchMatrix, fetchRoleDetails, authenticateUser } from './auth.service.js'
import { sendSuccess } from '../../utils/response.js'
import { NotFoundError } from '../../utils/errors.js'

export const getRoles = (req, res) => {
  sendSuccess(res, fetchRoles())
}

export const getPermissions = (req, res) => {
  sendSuccess(res, fetchPermissions())
}

export const getMatrix = (req, res) => {
  sendSuccess(res, fetchMatrix())
}

export const getRoleByCode = (req, res, next) => {
  try {
    const details = fetchRoleDetails(req.params.roleCode)
    if (!details) {
      throw new NotFoundError(`Role with code '${req.params.roleCode}' not found`)
    }
    sendSuccess(res, details)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle user authentication login endpoint POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const authResult = await authenticateUser(req.body)
    sendSuccess(res, authResult)
  } catch (err) {
    next(err)
  }
}
