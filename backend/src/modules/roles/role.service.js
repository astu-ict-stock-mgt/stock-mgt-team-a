/**
 * Role Management Service
 * Task: BE-036 (Role Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix), FR-01 (User Management)
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js'

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
          userRoles: true,
        },
      },
    },
  })

  return roles.map((role) => ({
    ...role,
    userCount: role._count.userRoles,
    _count: undefined,
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
          userRoles: true,
        },
      },
    },
  })

  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  return {
    ...role,
    permissions: role.rolePermissions.map((rp) => rp.permission),
    rolePermissions: undefined,
    userCount: role._count.userRoles,
    _count: undefined,
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
  if (permissionIds.length > 0) {
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    })
    if (permissions.length !== permissionIds.length) {
      throw new ValidationError('One or more permission IDs are invalid')
    }
  }

  const role = await prisma.role.create({
    data: {
      code: normalizedCode,
      name: name.trim(),
      description: description?.trim() || null,
      rolePermissions: permissionIds.length > 0
        ? {
            create: permissionIds.map((permissionId) => ({ permissionId })),
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

  return {
    ...role,
    permissions: role.rolePermissions.map((rp) => rp.permission),
    rolePermissions: undefined,
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

  return {
    ...updatedRole,
    permissions: updatedRole.rolePermissions.map((rp) => rp.permission),
    rolePermissions: undefined,
  }
}

/**
 * Assign permissions to role
 * @param {string} roleId - Role UUID
 * @param {Array<string>} permissionIds - Permission UUIDs to assign
 * @returns {Promise<Object>} Updated role with permissions
 */
export const assignPermissionsToRole = async (roleId, permissionIds) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  // Validate permissions
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
  })
  if (permissions.length !== permissionIds.length) {
    throw new ValidationError('One or more permission IDs are invalid')
  }

  // Remove existing permissions and add new ones
  await prisma.rolePermission.deleteMany({ where: { roleId } })
  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
  })

  return getRoleById(roleId)
}

/**
 * Remove permissions from role
 * @param {string} roleId - Role UUID
 * @param {Array<string>} permissionIds - Permission UUIDs to remove
 * @returns {Promise<Object>} Updated role with permissions
 */
export const removePermissionsFromRole = async (roleId, permissionIds) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  await prisma.rolePermission.deleteMany({
    where: {
      roleId,
      permissionId: { in: permissionIds },
    },
  })

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
    include: { userRoles: true },
  })

  if (!role) {
    throw new NotFoundError(`Role with ID '${roleId}' not found`)
  }

  if (role.userRoles.length > 0) {
    throw new ConflictError('Cannot delete role with assigned users')
  }

  // Delete role permissions first
  await prisma.rolePermission.deleteMany({ where: { roleId } })
  await prisma.role.delete({ where: { id: roleId } })
}
