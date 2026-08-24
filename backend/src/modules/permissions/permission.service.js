/**
 * Permission Management Service
 * Task: BE-037 (Permission Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix), FR-01 (User Management)
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ConflictError } from '../../utils/errors.js'

/**
 * Get all permissions
 * @returns {Promise<Array>} List of permissions
 */
export const getAllPermissions = async () => {
  const permissions = await prisma.permission.findMany({
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          rolePermissions: true,
        },
      },
    },
  })

  return permissions.map((permission) => ({
    ...permission,
    roleCount: permission._count.rolePermissions,
    _count: undefined,
  }))
}

/**
 * Get permission by ID
 * @param {string} permissionId - Permission UUID
 * @returns {Promise<Object>} Permission object
 */
export const getPermissionById = async (permissionId) => {
  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      rolePermissions: {
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
      _count: {
        select: {
          rolePermissions: true,
        },
      },
    },
  })

  if (!permission) {
    throw new NotFoundError(`Permission with ID '${permissionId}' not found`)
  }

  return {
    ...permission,
    roles: permission.rolePermissions.map((rp) => rp.role),
    rolePermissions: undefined,
    roleCount: permission._count.rolePermissions,
    _count: undefined,
  }
}

/**
 * Get permission by code
 * @param {string} code - Permission code
 * @returns {Promise<Object>} Permission object
 */
export const getPermissionByCode = async (code) => {
  const permission = await prisma.permission.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          rolePermissions: true,
        },
      },
    },
  })

  if (!permission) {
    throw new NotFoundError(`Permission with code '${code}' not found`)
  }

  return {
    ...permission,
    roleCount: permission._count.rolePermissions,
    _count: undefined,
  }
}

/**
 * Create a new permission
 * @param {Object} permissionData - { code, name, description }
 * @returns {Promise<Object>} Created permission
 */
export const createPermission = async ({ code, name, description }) => {
  const normalizedCode = code.toUpperCase().trim()

  // Check for existing permission
  const existingPermission = await prisma.permission.findUnique({
    where: { code: normalizedCode },
  })

  if (existingPermission) {
    throw new ConflictError(`Permission with code '${normalizedCode}' already exists`)
  }

  const permission = await prisma.permission.create({
    data: {
      code: normalizedCode,
      name: name.trim(),
      description: description?.trim() || null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
    },
  })

  return permission
}

/**
 * Update permission
 * @param {string} permissionId - Permission UUID
 * @param {Object} updateData - { name, description }
 * @returns {Promise<Object>} Updated permission
 */
export const updatePermission = async (permissionId, { name, description }) => {
  const permission = await prisma.permission.findUnique({ where: { id: permissionId } })
  if (!permission) {
    throw new NotFoundError(`Permission with ID '${permissionId}' not found`)
  }

  const updateFields = {}
  if (name) updateFields.name = name.trim()
  if (description !== undefined) updateFields.description = description?.trim() || null

  const updatedPermission = await prisma.permission.update({
    where: { id: permissionId },
    data: updateFields,
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return updatedPermission
}

/**
 * Delete permission
 * @param {string} permissionId - Permission UUID
 * @returns {Promise<void>}
 */
export const deletePermission = async (permissionId) => {
  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
    include: { rolePermissions: true },
  })

  if (!permission) {
    throw new NotFoundError(`Permission with ID '${permissionId}' not found`)
  }

  if (permission.rolePermissions.length > 0) {
    throw new ConflictError('Cannot delete permission assigned to roles')
  }

  await prisma.permission.delete({ where: { id: permissionId } })
}
