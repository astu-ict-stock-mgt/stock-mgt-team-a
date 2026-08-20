/**
 * Auth Domain Router & OpenAPI Specification
 * Tasks: BE-007, BE-028 (Implement Login API)
 */

import { Router } from 'express'
import { getRoles, getPermissions, getMatrix, getRoleByCode, login } from './auth.controller.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
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
 *                 example: admin@stockmgt.gov.et
 *               password:
 *                 type: string
 *                 format: password
 *                 example: AdminSecret@2026!
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         status:
 *                           type: string
 *                     token:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials or inactive account
 */
router.post('/login', validateRequest({ body: loginSchema }), login)

router.get('/roles', getRoles)
router.get('/roles/:roleCode', getRoleByCode)
router.get('/permissions', getPermissions)
router.get('/matrix', getMatrix)

export default router
