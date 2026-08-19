/**
 * RBAC Routes
 * Tasks: BE-002 & BE-006
 */

import { Router } from 'express'
import { getRoles, getPermissions, getMatrix, getRoleByCode } from '../controllers/rbac.controller.js'

const router = Router()

router.get('/rbac/roles', getRoles)
router.get('/rbac/permissions', getPermissions)
router.get('/rbac/matrix', getMatrix)
router.get('/rbac/roles/:roleCode', getRoleByCode)

export default router
