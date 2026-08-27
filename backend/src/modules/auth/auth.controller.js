/**
 * Auth & User Domain Controller
 * Tasks: BE-007, BE-016, BE-028, BE-030 (Implement Logout/Session Revocation)
 */

import {
  fetchRoles,
  fetchPermissions,
  fetchMatrix,
  fetchRoleDetails,
  authenticateUser,
  logoutUser,
} from './auth.service.js'
import { getPermissionsForRoles } from '../../config/permission-cache.js'
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

export const getMyPermissions = async (req, res, next) => {
  try {
    const roles = (req.user?.roles?.length ? req.user.roles : null)
      || (req.user?.role ? [req.user.role] : null)
      || ['REQUESTER']
    const permissions = await getPermissionsForRoles(roles)
    sendSuccess(res, { roles, permissions })
  } catch (err) {
    next(err)
  }
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

/**
 * Handle user logout & session revocation endpoint POST /api/auth/logout (BE-030)
 */
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization
    const token = authHeader?.split(' ')[1]
    const result = await logoutUser(token)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
