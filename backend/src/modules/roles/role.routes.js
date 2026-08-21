/**
 * Role Management Routes
 * Task: BE-036 (Role Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import { Router } from 'express'
import {
  listRoles,
  getRole,
  createNewRole,
  updateRoleDetails,
  assignPermissions,
  removePermissions,
  deleteRoleById,
} from './role.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { createRoleSchema, updateRoleSchema, assignPermissionsSchema } from './dto/role.dto.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

/**
 * @openapi
 * /roles:
 *   get:
 *     summary: List all roles
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize(PERMISSIONS.USERS_READ), listRoles)

/**
 * @openapi
 * /roles/{roleId}:
 *   get:
 *     summary: Get role by ID
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role details
 *       404:
 *         description: Role not found
 */
router.get('/:roleId', authenticate, authorize(PERMISSIONS.USERS_READ), getRole)

/**
 * @openapi
 * /roles:
 *   post:
 *     summary: Create new role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Role created
 *       409:
 *         description: Role already exists
 */
router.post('/', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: createRoleSchema }), createNewRole)

/**
 * @openapi
 * /roles/{roleId}:
 *   put:
 *     summary: Update role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: Role not found
 */
router.put('/:roleId', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: updateRoleSchema }), updateRoleDetails)

/**
 * @openapi
 * /roles/{roleId}/permissions:
 *   post:
 *     summary: Assign permissions to role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
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
 *               - permissionIds
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions assigned
 *       404:
 *         description: Role not found
 */
router.post('/:roleId/permissions', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: assignPermissionsSchema }), assignPermissions)

/**
 * @openapi
 * /roles/{roleId}/permissions:
 *   delete:
 *     summary: Remove permissions from role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
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
 *               - permissionIds
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions removed
 *       404:
 *         description: Role not found
 */
router.delete('/:roleId/permissions', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: assignPermissionsSchema }), removePermissions)

/**
 * @openapi
 * /roles/{roleId}:
 *   delete:
 *     summary: Delete role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role has assigned users
 */
router.delete('/:roleId', authenticate, authorize(PERMISSIONS.USERS_MANAGE), deleteRoleById)

export default router
