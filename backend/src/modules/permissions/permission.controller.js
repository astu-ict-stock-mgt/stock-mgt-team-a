/**
 * Permission Management Controller
 * Task: BE-037 (Permission Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import {
  getAllPermissions,
  getPermissionById,
  getPermissionByCode,
  createPermission,
  updatePermission,
  deletePermission,
} from './permission.service.js'
import { sendSuccess, sendCreated } from '../../utils/response.js'

/**
 * Get all permissions
 */
export const listPermissions = async (req, res, next) => {
  try {
    const permissions = await getAllPermissions()
    sendSuccess(res, permissions)
  } catch (err) {
    next(err)
  }
}

/**
 * Get permission by ID
 */
export const getPermission = async (req, res, next) => {
  try {
    const permission = await getPermissionById(req.params.permissionId)
    sendSuccess(res, permission)
  } catch (err) {
    next(err)
  }
}

/**
 * Get permission by code
 */
export const getPermissionByCodeHandler = async (req, res, next) => {
  try {
    const permission = await getPermissionByCode(req.params.code)
    sendSuccess(res, permission)
  } catch (err) {
    next(err)
  }
}

/**
 * Create new permission
 */
export const createNewPermission = async (req, res, next) => {
  try {
    const { code, name, description } = req.body
    const permission = await createPermission({ code, name, description })
    sendCreated(res, permission)
  } catch (err) {
    next(err)
  }
}

/**
 * Update permission
 */
export const updatePermissionDetails = async (req, res, next) => {
  try {
    const { name, description } = req.body
    const permission = await updatePermission(req.params.permissionId, { name, description })
    sendSuccess(res, permission)
  } catch (err) {
    next(err)
  }
}

/**
 * Delete permission
 */
export const deletePermissionById = async (req, res, next) => {
  try {
    await deletePermission(req.params.permissionId)
    sendSuccess(res, { message: 'Permission deleted successfully' })
  } catch (err) {
    next(err)
  }
}
