/**
 * Auth & User Domain Router
 * Task: BE-007
 */

import { Router } from 'express'
import { getRoles, getPermissions, getMatrix, getRoleByCode } from './auth.controller.js'

const router = Router()

router.get('/rbac/roles', getRoles)
router.get('/rbac/permissions', getPermissions)
router.get('/rbac/matrix', getMatrix)
router.get('/rbac/roles/:roleCode', getRoleByCode)

export default router
