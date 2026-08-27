/**
 * Auth Domain Router & OpenAPI Specification
 * Tasks: BE-007, BE-028, BE-029, BE-030, BE-032 (Implement RBAC Authorization Middleware)
 */

import { Router } from 'express'
import { getRoles, getPermissions, getMatrix, getMyPermissions, getRoleByCode, login, logout } from './auth.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'
import { sendSuccess } from '../../utils/response.js'
import { loginSchema } from './dto/login.dto.js'

const router = Router()

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate user credentials and return JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateRequest({ body: loginSchema }), login)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out user and revoke session token
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       401:
 *         description: Missing or invalid token
 */
router.post('/logout', authenticate, logout)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user context
 *       401:
 *         description: Missing or invalid token
 */
router.get('/me', authenticate, (req, res) => {
  sendSuccess(res, req.user)
})

router.get('/me/permissions', authenticate, getMyPermissions)
router.get('/roles', authenticate, getRoles)
router.get('/roles/:roleCode', authenticate, getRoleByCode)
router.get('/permissions', authenticate, getPermissions)
router.get('/matrix', authenticate, getMatrix)

export default router
