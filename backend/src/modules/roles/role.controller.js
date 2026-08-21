/**
 * Role Management Controller
 * Task: BE-036 (Role Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  assignPermissionsToRole,
  removePermissionsFromRole,
  deleteRole,
} from './role.service.js'
import { sendSuccess, sendCreated } from '../../utils/response.js'

/**
 * Get all roles
 */
export const listRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles()
    sendSuccess(res, roles)
  } catch (err) {
    next(err)
  }
}

/**
 * Get role by ID
 */
export const getRole = async (req, res, next) => {
  try {
    const role = await getRoleById(req.params.roleId)
    sendSuccess(res, role)
  } catch (err) {
    next(err)
  }
}

/**
 * Create new role
 */
export const createNewRole = async (req, res, next) => {
  try {
    const { code, name, description, permissionIds } = req.body
    const role = await createRole({ code, name, description, permissionIds })
    sendCreated(res, role)
  } catch (err) {
    next(err)
  }
}

/**
 * Update role
 */
export const updateRoleDetails = async (req, res, next) => {
  try {
    const { name, description } = req.body
    const role = await updateRole(req.params.roleId, { name, description })
    sendSuccess(res, role)
  } catch (err) {
    next(err)
  }
}

/**
 * Assign permissions to role
 */
export const assignPermissions = async (req, res, next) => {
  try {
    const { permissionIds } = req.body
    const role = await assignPermissionsToRole(req.params.roleId, permissionIds)
    sendSuccess(res, role)
  } catch (err) {
    next(err)
  }
}

/**
 * Remove permissions from role
 */
export const removePermissions = async (req, res, next) => {
  try {
    const { permissionIds } = req.body
    const role = await removePermissionsFromRole(req.params.roleId, permissionIds)
    sendSuccess(res, role)
  } catch (err) {
    next(err)
  }
}

/**
 * Delete role
 */
export const deleteRoleById = async (req, res, next) => {
  try {
    await deleteRole(req.params.roleId)
    sendSuccess(res, { message: 'Role deleted successfully' })
  } catch (err) {
    next(err)
  }
}
