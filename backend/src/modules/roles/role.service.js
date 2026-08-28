/**
 * Role Management Service
 * Task: BE-036 (Role Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix), FR-01 (User Management)
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js'
import { invalidatePermissionCache } from '../../config/permission-cache.js'

/**
 * Get all roles
 * @returns {Promise<Array>} List of roles
 */
export const getAllRoles = async () => {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  })

  return roles.map(({ _count, ...rest }) => ({
    ...rest,
    userCount: _count.users,
  }))
}

/**
 * Get role by ID
 * @param {string} roleId - Role UUID
 * @returns {Promise<Object>} Role object
 */
export const getRoleById = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      rolePermissions: {
        select: {
          permission: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
            },
          },
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  })

  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  const { rolePermissions, _count, ...rest } = role
  return {
    ...rest,
    permissions: rolePermissions.map((rp) => rp.permission),
    userCount: _count.users,
  }
}

/**
 * Create a new role
 * @param {Object} roleData - { code, name, description, permissionIds }
 * @returns {Promise<Object>} Created role
 */
export const createRole = async ({ code, name, description, permissionIds = [] }) => {
  const normalizedCode = code.toUpperCase().trim()

  // Check for existing role
  const existingRole = await prisma.role.findUnique({
    where: { code: normalizedCode },
  })

  if (existingRole) {
    throw new ConflictError(`Role with code '${normalizedCode}' already exists`)
  }

  // Validate permissions if provided
  let resolvedPermissions = []
  if (permissionIds.length > 0) {
    resolvedPermissions = await prisma.permission.findMany({
      where: { code: { in: permissionIds } },
    })
    if (resolvedPermissions.length !== permissionIds.length) {
      throw new ValidationError('One or more permission codes are invalid')
    }
  }

  const role = await prisma.role.create({
    data: {
      code: normalizedCode,
      name: name.trim(),
      description: description?.trim() || null,
      rolePermissions: resolvedPermissions.length > 0
        ? {
            create: resolvedPermissions.map((p) => ({ permissionId: p.id })),
          }
        : undefined,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      rolePermissions: {
        select: {
          permission: {
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

  const { rolePermissions, ...rest } = role
  return {
    ...rest,
    permissions: rolePermissions.map((rp) => rp.permission),
  }
}

/**
 * Update role
 * @param {string} roleId - Role UUID
 * @param {Object} updateData - { name, description }
 * @returns {Promise<Object>} Updated role
 */
export const updateRole = async (roleId, { name, description }) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  const updateFields = {}
  if (name) updateFields.name = name.trim()
  if (description !== undefined) updateFields.description = description?.trim() || null

  const updatedRole = await prisma.role.update({
    where: { id: roleId },
    data: updateFields,
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      rolePermissions: {
        select: {
          permission: {
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

  const { rolePermissions, ...updatedRest } = updatedRole
  return {
    ...updatedRest,
    permissions: rolePermissions.map((rp) => rp.permission),
  }
}

/**
 * Assign permissions to role
 * @param {string} roleId - Role UUID
 * @param {Array<string>} permissionCodes - Permission codes (e.g. 'users:create') to assign
 * @returns {Promise<Object>} Updated role with permissions
 */
export const assignPermissionsToRole = async (roleId, permissionCodes) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  // Look up permissions by code
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  })
  if (permissions.length !== permissionCodes.length) {
    const found = permissions.map((p) => p.code)
    const missing = permissionCodes.filter((c) => !found.includes(c))
    throw new ValidationError(`Invalid permission codes: ${missing.join(', ')}`)
  }

  // Remove existing permissions and add new ones
  await prisma.rolePermission.deleteMany({ where: { roleId } })
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({ roleId, permissionId: p.id })),
  })

  invalidatePermissionCache(role.code)
  return getRoleById(roleId)
}

/**
 * Remove permissions from role
 * @param {string} roleId - Role UUID
 * @param {Array<string>} permissionCodes - Permission codes (e.g. 'users:create') to remove
 * @returns {Promise<Object>} Updated role with permissions
 */
export const removePermissionsFromRole = async (roleId, permissionCodes) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  })

  if (permissions.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissions.map((p) => p.id) },
      },
    })
  }

  invalidatePermissionCache(role.code)
  return getRoleById(roleId)
}

/**
 * Delete role
 * @param {string} roleId - Role UUID
 * @returns {Promise<void>}
 */
export const deleteRole = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { users: true },
  })

  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  if (role.users.length > 0) {
    throw new ConflictError('Cannot delete role with assigned users')
  }

  // Delete role permissions first
  await prisma.rolePermission.deleteMany({ where: { roleId } })
  await prisma.role.delete({ where: { id: roleId } })

  // Invalidate permission cache for this role
  invalidatePermissionCache(role.code)
}
