/**
 * Account Activation/Deactivation Controller
 * Task: BE-038 (Account Activation/Deactivation)
 * SRS Traceability: FR-01 (User Management)
 */

import {
  activateUser,
  deactivateUser,
  toggleUserStatus,
  bulkActivateUsers,
  bulkDeactivateUsers,
} from './account-activation.service.js'
import { sendSuccess } from '../../utils/response.js'

/**
 * Activate user account
 */
export const activate = async (req, res, next) => {
  try {
    const user = await activateUser(req.params.userId)
    sendSuccess(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Deactivate user account
 */
export const deactivate = async (req, res, next) => {
  try {
    const user = await deactivateUser(req.params.userId)
    sendSuccess(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Toggle user account status
 */
export const toggleStatus = async (req, res, next) => {
  try {
    const user = await toggleUserStatus(req.params.userId)
    sendSuccess(res, user)
  } catch (err) {
    next(err)
  }
}

/**
 * Bulk activate users
 */
export const bulkActivate = async (req, res, next) => {
  try {
    const { userIds } = req.body
    const result = await bulkActivateUsers(userIds)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * Bulk deactivate users
 */
export const bulkDeactivate = async (req, res, next) => {
  try {
    const { userIds } = req.body
    const result = await bulkDeactivateUsers(userIds)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
