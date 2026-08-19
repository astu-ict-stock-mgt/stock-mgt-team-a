/**
 * Auth & User Domain Service
 * Task: BE-007
 */

import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX, getPermissionsForRole } from '../../config/rbac.js'

export const fetchRoles = () => ROLES
export const fetchPermissions = () => PERMISSIONS
export const fetchMatrix = () => ROLE_PERMISSIONS_MATRIX
export const fetchRoleDetails = (roleCode) => {
  const code = roleCode.toUpperCase()
  if (!ROLES[code]) return null
  return {
    role: ROLES[code],
    permissions: getPermissionsForRole(code),
  }
}
