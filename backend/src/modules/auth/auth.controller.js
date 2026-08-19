/**
 * Auth & User Domain Controller
 * Task: BE-007
 */

import { fetchRoles, fetchPermissions, fetchMatrix, fetchRoleDetails } from './auth.service.js'

export const getRoles = (req, res) => {
  res.json({ success: true, data: fetchRoles() })
}

export const getPermissions = (req, res) => {
  res.json({ success: true, data: fetchPermissions() })
}

export const getMatrix = (req, res) => {
  res.json({ success: true, data: fetchMatrix() })
}

export const getRoleByCode = (req, res) => {
  const details = fetchRoleDetails(req.params.roleCode)
  if (!details) {
    return res.status(404).json({ success: false, error: 'Role not found' })
  }
  res.json({ success: true, data: details })
}
