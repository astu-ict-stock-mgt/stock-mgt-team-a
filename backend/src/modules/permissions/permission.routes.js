/**
 * Permission Management Routes
 * Task: BE-037 (Permission Management APIs)
 * SRS Traceability: Appendix C (Role & Permission Matrix)
 */

import { Router } from 'express'
import {
  listPermissions,
  getPermission,
  getPermissionByCodeHandler,
  createNewPermission,
  updatePermissionDetails,
  deletePermissionById,
} from './permission.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { createPermissionSchema, updatePermissionSchema } from './dto/permission.dto.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

/**
 * @openapi
 * /permissions:
 *   get:
 *     summary: List all permissions
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize(PERMISSIONS.USERS_READ), listPermissions)

/**
 * @openapi
 * /permissions/{permissionId}:
 *   get:
 *     summary: Get permission by ID
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission details
 *       404:
 *         description: Permission not found
 */
router.get('/:permissionId', authenticate, authorize(PERMISSIONS.USERS_READ), getPermission)

/**
 * @openapi
 * /permissions/code/{code}:
 *   get:
 *     summary: Get permission by code
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission details
 *       404:
 *         description: Permission not found
 */
router.get('/code/:code', authenticate, authorize(PERMISSIONS.USERS_READ), getPermissionByCodeHandler)

/**
 * @openapi
 * /permissions:
 *   post:
 *     summary: Create new permission
 *     tags:
 *       - Permissions
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
 *     responses:
 *       201:
 *         description: Permission created
 *       409:
 *         description: Permission already exists
 */
router.post('/', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: createPermissionSchema }), createNewPermission)

/**
 * @openapi
 * /permissions/{permissionId}:
 *   put:
 *     summary: Update permission
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
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
 *         description: Permission updated
 *       404:
 *         description: Permission not found
 */
router.put('/:permissionId', authenticate, authorize(PERMISSIONS.USERS_MANAGE), validateRequest({ body: updatePermissionSchema }), updatePermissionDetails)

/**
 * @openapi
 * /permissions/{permissionId}:
 *   delete:
 *     summary: Delete permission
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission deleted
 *       404:
 *         description: Permission not found
 *       409:
 *         description: Permission assigned to roles
 */
router.delete('/:permissionId', authenticate, authorize(PERMISSIONS.USERS_MANAGE), deletePermissionById)

export default router
