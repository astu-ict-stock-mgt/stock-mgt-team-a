/**
 * RBAC Controller
 * Tasks: BE-002 & BE-006
 */

import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX, getPermissionsForRole } from '../config/rbac.js'

export const getRoles = (req, res) => {
  res.json({ success: true, data: ROLES })
}

export const getPermissions = (req, res) => {
  res.json({ success: true, data: PERMISSIONS })
}

export const getMatrix = (req, res) => {
  res.json({ success: true, data: ROLE_PERMISSIONS_MATRIX })
}

export const getRoleByCode = (req, res) => {
  const roleCode = req.params.roleCode.toUpperCase()
  if (!ROLES[roleCode]) {
    return res.status(404).json({ success: false, error: 'Role not found' })
  }
  res.json({
    success: true,
    data: {
      role: ROLES[roleCode],
      permissions: getPermissionsForRole(roleCode),
    },
  })
}
