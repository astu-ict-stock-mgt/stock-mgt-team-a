/**
 * User Management Controller
 * Task: BE-034 (User Management Service)
 * SRS Traceability: FR-01 (User Management)
 */

import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  assignRolesToUser,
  removeRolesFromUser,
  deleteUser,
} from './user.service.js'
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js'

/**
 * Get all users with pagination
 */
export const listUsers = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const result = await getAllUsers({ page, limit, search, status })
    sendPaginated(res, result.users, result.pagination.page, result.pagination.limit, result.pagination.totalItems)
  } catch (err) {
    next(err)
  }
}

/**
 * Get user by ID
 */
export const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.userId)
    sendSuccess(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Create new user
 */
export const createNewUser = async (req, res, next) => {
  try {
    const { email, fullName, password, roleIds } = req.body
    const user = await createUser({ email, fullName, password, roleIds })
    sendCreated(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Update user
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { fullName, email } = req.body
    const user = await updateUser(req.params.userId, { fullName, email })
    sendSuccess(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Assign roles to user
 */
export const assignRoles = async (req, res, next) => {
  try {
    const { roleIds } = req.body
    const user = await assignRolesToUser(req.params.userId, roleIds)
    sendSuccess(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Remove roles from user
 */
export const removeRoles = async (req, res, next) => {
  try {
    const { roleIds } = req.body
    const user = await removeRolesFromUser(req.params.userId, roleIds)
    sendSuccess(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Delete user
 */
export const deleteUserAccount = async (req, res, next) => {
  try {
    await deleteUser(req.params.userId)
    sendSuccess(res, { message: 'User deleted successfully' })
  } catch (err) {
    next(err)
  }
}
