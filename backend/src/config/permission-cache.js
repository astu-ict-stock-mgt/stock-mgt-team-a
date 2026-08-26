/**
 * Permission Cache Service
 * Caches role-permission mappings from DB with TTL-based invalidation.
 * Falls back to hardcoded matrix if DB is unavailable.
 */

import { prisma } from './database.js'
import { ROLE_PERMISSIONS_MATRIX, PERMISSIONS } from './rbac.js'

const CACHE = new Map()
const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get permissions for a role code (from cache or DB).
 * @param {string} roleCode - e.g. 'ADMIN'
 * @returns {Promise<string[]>} Array of permission key strings
 */
export async function getPermissionsFromDB(roleCode) {
  const cached = CACHE.get(roleCode)
  if (cached && Date.now() - cached.ts < DEFAULT_TTL_MS) {
    return cached.perms
  }

  try {
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
      select: {
        rolePermissions: {
          select: {
            permission: {
              select: { code: true },
            },
          },
        },
      },
    })

    if (!role) {
      // Role not in DB — fall back to hardcoded matrix
      return ROLE_PERMISSIONS_MATRIX[roleCode] || []
    }

    const perms = role.rolePermissions.map((rp) => rp.permission.code)

    // If DB has no permissions for this role, fall back to matrix
    if (perms.length === 0) {
      return ROLE_PERMISSIONS_MATRIX[roleCode] || []
    }

    CACHE.set(roleCode, { perms, ts: Date.now() })
    return perms
  } catch {
    // DB error — fall back to hardcoded matrix
    return ROLE_PERMISSIONS_MATRIX[roleCode] || []
  }
}

/**
 * Get permissions for multiple roles (deduplicated).
 * @param {string[]} roleCodes
 * @returns {Promise<Set<string>>} Set of permission keys
 */
export async function getPermissionsForRoles(roleCodes) {
  const allPerms = new Set()
  for (const code of roleCodes) {
    const perms = await getPermissionsFromDB(code)
    perms.forEach((p) => allPerms.add(p))
  }
  return allPerms
}

/**
 * Invalidate cache for a specific role or all roles.
 * @param {string} [roleCode] - If omitted, clears entire cache
 */
export function invalidatePermissionCache(roleCode) {
  if (roleCode) {
    CACHE.delete(roleCode)
  } else {
    CACHE.clear()
  }
}
