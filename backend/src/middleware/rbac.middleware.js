/**
 * Central RBAC Authorization Middleware (Deny-by-Default)
 * Task: BE-032 (Implement RBAC Authorization Middleware)
 * SRS Traceability: Appendix C (Role & Permission Matrix), Section 13 (Security)
 *
 * Now uses dynamic DB permissions via permission-cache service.
 * Falls back to hardcoded matrix if DB is unavailable.
 */

import { getPermissionsForRoles } from '../config/permission-cache.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'

/**
 * Higher-order Express middleware gating route access based on required permissions.
 * Enforces a strict Deny-by-Default security posture.
 * 
 * @param {string|Object|Array<string|Object>} requiredPermissions - Single permission code string/object or array
 * @returns {Function} Express middleware function
 */
export const authorize = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // 1. Ensure user is authenticated (req.user populated by authenticate middleware)
      if (!req.user) {
        throw new UnauthorizedError('Authentication required prior to authorization')
      }

      // 2. Extract user role (Default to REQUESTER if unassigned)
      const userRoles = (req.user.roles?.length ? req.user.roles : null)
        || (req.user.role ? [req.user.role] : null)
        || (req.user.roleCode ? [req.user.roleCode] : null)
        || ['REQUESTER']

      // 3. Normalize required permissions to string keys
      const rawList = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions]

      const permissionsArray = rawList.map((p) => {
        const key = (typeof p === 'object' && p?.key ? p.key : String(p))
        return key.includes('.') && !key.includes(':') ? key.replace(/\./g, ':') : key
      })

      // 4. Load user permissions from DB (cached)
      const userPerms = await getPermissionsForRoles(userRoles)

      // 5. Verify user possesses all required permissions
      const isAuthorized = permissionsArray.every((permKey) => {
        if (userPerms.has(permKey)) return true
        // Check if a parent manage permission covers this
        const [module, action] = permKey.split(':')
        if (action !== 'manage' && userPerms.has(`${module}:manage`)) return true
        return false
      })

      if (!isAuthorized) {
        throw new ForbiddenError(`Access denied: roles '${userRoles.join(',')}' lack required permissions`)
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
