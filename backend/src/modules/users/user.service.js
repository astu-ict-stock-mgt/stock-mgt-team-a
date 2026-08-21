/**
 * User Management Service
 * Task: BE-034 (User Management Service)
 * SRS Traceability: FR-01 (User Management), Section 13 (Security Requirements)
 */

import { prisma } from '../../config/database.js'
import { hashPassword } from '../../utils/password.js'
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js'

/**
 * Get all users with pagination and filtering
 * @param {Object} options - { page, limit, search, status }
 * @returns {Promise<Object>} Paginated users list
 */
export const getAllUsers = async ({ page = 1, limit = 10, search = '', status = null } = {}) => {
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10))
  const skip = (pageNum - 1) * limitNum

  const where = {}
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) {
    where.status = status.toUpperCase()
  }

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
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
    }),
    prisma.user.count({ where }),
  ])

  const formattedUsers = users.map((user) => ({
    ...user,
    roles: user.userRoles.map((ur) => ur.role),
    userRoles: undefined,
  }))

  return {
    users: formattedUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
    },
  }
}

/**
 * Get user by ID
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User object
 */
export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
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

  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  return {
    ...user,
    roles: user.userRoles.map((ur) => ur.role),
    userRoles: undefined,
  }
}

/**
 * Create a new user
 * @param {Object} userData - { email, fullName, password, roleIds }
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async ({ email, fullName, password, roleIds = [] }) => {
  const normalizedEmail = email.toLowerCase().trim()

  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    throw new ConflictError(`User with email '${normalizedEmail}' already exists`)
  }

  // Validate roles if provided
  if (roleIds.length > 0) {
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    })
    if (roles.length !== roleIds.length) {
      throw new ValidationError('One or more role IDs are invalid')
    }
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: fullName.trim(),
      passwordHash,
      status: 'ACTIVE',
      userRoles: roleIds.length > 0
        ? {
            create: roleIds.map((roleId) => ({ roleId })),
          }
        : undefined,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      userRoles: {
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
    ...user,
    roles: user.userRoles.map((ur) => ur.role),
    userRoles: undefined,
  }
}

/**
 * Update user details
 * @param {string} userId - User UUID
 * @param {Object} updateData - { fullName, email }
 * @returns {Promise<Object>} Updated user object
 */
export const updateUser = async (userId, { fullName, email }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  const updateFields = {}
  if (fullName) updateFields.fullName = fullName.trim()
  if (email) {
    const normalizedEmail = email.toLowerCase().trim()
    if (normalizedEmail !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (existing) {
        throw new ConflictError(`User with email '${normalizedEmail}' already exists`)
      }
      updateFields.email = normalizedEmail
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateFields,
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
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
    roles: updatedUser.userRoles.map((ur) => ur.role),
    userRoles: undefined,
  }
}

/**
 * Assign roles to user
 * @param {string} userId - User UUID
 * @param {Array<string>} roleIds - Role UUIDs to assign
 * @returns {Promise<Object>} Updated user with roles
 */
export const assignRolesToUser = async (userId, roleIds) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  // Validate roles
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
  })
  if (roles.length !== roleIds.length) {
    throw new ValidationError('One or more role IDs are invalid')
  }

  // Remove existing roles and add new ones
  await prisma.userRole.deleteMany({ where: { userId } })
  await prisma.userRole.createMany({
    data: roleIds.map((roleId) => ({ userId, roleId })),
  })

  return getUserById(userId)
}

/**
 * Remove roles from user
 * @param {string} userId - User UUID
 * @param {Array<string>} roleIds - Role UUIDs to remove
 * @returns {Promise<Object>} Updated user with roles
 */
export const removeRolesFromUser = async (userId, roleIds) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  await prisma.userRole.deleteMany({
    where: {
      userId,
      roleId: { in: roleIds },
    },
  })

  return getUserById(userId)
}

/**
 * Delete user
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError(`User with ID '${userId}' not found`)
  }

  // Delete user roles first
  await prisma.userRole.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })
}
