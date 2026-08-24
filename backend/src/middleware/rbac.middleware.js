/**
 * Central RBAC Authorization Middleware (Deny-by-Default)
 * Task: BE-032 (Implement RBAC Authorization Middleware)
 * SRS Traceability: Appendix C (Role & Permission Matrix), Section 13 (Security)
 */

import { hasPermission } from '../config/rbac.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'

/**
 * Higher-order Express middleware gating route access based on required permissions.
 * Enforces a strict Deny-by-Default security posture.
 * 
 * @param {string|Object|Array<string|Object>} requiredPermissions - Single permission code string/object or array
 * @returns {Function} Express middleware function
 */
export const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      // 1. Ensure user is authenticated (req.user populated by authenticate middleware)
      if (!req.user) {
        throw new UnauthorizedError('Authentication required prior to authorization')
      }

      // 2. Extract user role (Default to REQUESTER if unassigned)
      const userRole = req.user.role || req.user.roleCode || 'REQUESTER'

      // 3. Normalize required permissions to string keys
      const rawList = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions]

      const permissionsArray = rawList.map((p) => (typeof p === 'object' && p?.key ? p.key : String(p)))

      // 4. Verify user role possesses all required permissions
      const isAuthorized = permissionsArray.every((permKey) => hasPermission(userRole, permKey))

      if (!isAuthorized) {
        throw new ForbiddenError(`Access denied: role '${userRole}' lacks required permissions`)
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
