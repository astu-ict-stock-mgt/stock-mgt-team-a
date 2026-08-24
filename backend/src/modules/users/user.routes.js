/**
 * User Management Routes
 * Task: BE-034 (User Management Service)
 * SRS Traceability: FR-01 (User Management)
 */

import { Router } from 'express'
import {
  listUsers,
  getUser,
  createNewUser,
  updateUserProfile,
  assignRoles,
  removeRoles,
  deleteUserAccount,
} from './user.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { createUserSchema, updateUserSchema, assignRolesSchema } from './dto/user.dto.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users with pagination
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize(PERMISSIONS.USERS_READ), listUsers)

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:userId', authenticate, authorize(PERMISSIONS.USERS_READ), getUser)

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create new user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - fullName
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *               password:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: User already exists
 */
router.post('/', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: createUserSchema }), createNewUser)

/**
 * @openapi
 * /users/{userId}:
 *   put:
 *     summary: Update user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put('/:userId', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: updateUserSchema }), updateUserProfile)

/**
 * @openapi
 * /users/{userId}/roles:
 *   post:
 *     summary: Assign roles to user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Roles assigned
 *       404:
 *         description: User not found
 */
router.post('/:userId/roles', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: assignRolesSchema }), assignRoles)

/**
 * @openapi
 * /users/{userId}/roles:
 *   delete:
 *     summary: Remove roles from user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Roles removed
 *       404:
 *         description: User not found
 */
router.delete('/:userId/roles', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: assignRolesSchema }), removeRoles)

/**
 * @openapi
 * /users/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/:userId', authenticate, authorize(PERMISSIONS.USERS_MANAGE), deleteUserAccount)

export default router
