/**
 * Account Activation/Deactivation Service
 * Task: BE-038 (Account Activation/Deactivation)
 * SRS Traceability: FR-01 (User Management), Section 13 (Security Requirements)
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ConflictError } from '../../utils/errors.js'

/**
 * Activate user account
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Updated user
 */
export const activateUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  if (user.status === 'ACTIVE') {
    throw new ConflictError('User account is already active')
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE', updatedAt: new Date() },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return {
    ...updatedUser,
    roles: updatedUser.roles.map((ur) => ur.role),
  }
}

/**
 * Deactivate user account
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Updated user
 */
export const deactivateUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  if (user.status === 'INACTIVE') {
    throw new ConflictError('User account is already inactive')
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: 'INACTIVE', updatedAt: new Date() },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return {
    ...updatedUser,
    roles: updatedUser.roles.map((ur) => ur.role),
  }
}

/**
 * Toggle user account status
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Updated user
 */
export const toggleUserStatus = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus, updatedAt: new Date() },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return {
    ...updatedUser,
    roles: updatedUser.roles.map((ur) => ur.role),
  }
}

/**
 * Bulk activate users
 * @param {Array<string>} userIds - User UUIDs
 * @returns {Promise<Object>} Results
 */
export const bulkActivateUsers = async (userIds) => {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  })

  if (users.length !== userIds.length) {
    throw new NotFoundError('One or more user IDs are invalid')
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: userIds }, status: 'INACTIVE' },
    data: { status: 'ACTIVE', updatedAt: new Date() },
  })

  return {
    activated: result.count,
    total: userIds.length,
  }
}

/**
 * Bulk deactivate users
 * @param {Array<string>} userIds - User UUIDs
 * @returns {Promise<Object>} Results
 */
export const bulkDeactivateUsers = async (userIds) => {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  })

  if (users.length !== userIds.length) {
    throw new NotFoundError('One or more user IDs are invalid')
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: userIds }, status: 'ACTIVE' },
    data: { status: 'INACTIVE', updatedAt: new Date() },
  })

  return {
    deactivated: result.count,
    total: userIds.length,
  }
}
