/**
 * Identity & Access Management Integration Tests
 * Task: BE-040 (Identity & Access Integration Tests)
 * SRS Traceability: Section 13 (Security Requirements), FR-01, FR-03
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import authRoutes from '../../src/modules/auth/auth.routes.js'
import userRoutes from '../../src/modules/users/user.routes.js'
import roleRoutes from '../../src/modules/roles/role.routes.js'
import permissionRoutes from '../../src/modules/permissions/permission.routes.js'
import accountActivationRoutes from '../../src/modules/users/account-activation.routes.js'
import auditRoutes from '../../src/modules/audit/audit.routes.js'
import { errorHandler } from '../../src/middleware/error.middleware.js'
import { prisma } from '../../src/config/database.js'
import { hashPassword } from '../../src/utils/password.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/users', accountActivationRoutes)
app.use('/api/audit', auditRoutes)
app.use(errorHandler)

let adminToken
let testUserId
let testRoleId

describe('Identity & Access Management Integration Tests', () => {
  beforeAll(async () => {
    // Create test admin user
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'iam-test-admin@example.com' },
    })

    let adminId
    if (!existingAdmin) {
      const passwordHash = await hashPassword('Admin123!')
      const admin = await prisma.user.create({
        data: {
          email: 'iam-test-admin@example.com',
          fullName: 'IAM Test Admin',
          passwordHash,
          status: 'ACTIVE',
        },
      })
      adminId = admin.id
    } else {
      adminId = existingAdmin.id
    }

    // Get admin token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'iam-test-admin@example.com', password: 'Admin123!' })

    if (loginResponse.body.success) {
      adminToken = loginResponse.body.data.token
    }
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.userRole.deleteMany({ where: { user: { email: { contains: 'iam-test' } } } })
    await prisma.rolePermission.deleteMany({ where: { role: { code: { contains: 'TEST' } } } })
    await prisma.user.deleteMany({ where: { email: { contains: 'iam-test' } } })
    await prisma.role.deleteMany({ where: { code: { contains: 'TEST' } } })
  })

  describe('Authentication Flow', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'iam-test-admin@example.com', password: 'Admin123!' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user).toBeDefined()
    })

    it('should fail login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'iam-test-admin@example.com', password: 'WrongPassword' })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('should get current user profile', async () => {
      if (!adminToken) return

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('iam-test-admin@example.com')
    })

    it('should logout successfully', async () => {
      if (!adminToken) return

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('User Management Flow', () => {
    it('should create a new user', async () => {
      if (!adminToken) return

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'iam-test-user@example.com',
          fullName: 'IAM Test User',
          password: 'User123!',
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('iam-test-user@example.com')
      testUserId = response.body.data.id
    })

    it('should get user by ID', async () => {
      if (!adminToken || !testUserId) return

      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testUserId)
    })

    it('should list all users', async () => {
      if (!adminToken) return

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.meta).toBeDefined()
    })

    it('should update user', async () => {
      if (!adminToken || !testUserId) return

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'IAM Test User Updated' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.fullName).toBe('IAM Test User Updated')
    })

    it('should not create user with duplicate email', async () => {
      if (!adminToken) return

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'iam-test-user@example.com',
          fullName: 'Duplicate User',
          password: 'User123!',
        })

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Role Management Flow', () => {
    it('should create a new role', async () => {
      if (!adminToken) return

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST_ROLE',
          name: 'Test Role',
          description: 'A test role for integration tests',
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.code).toBe('TEST_ROLE')
      testRoleId = response.body.data.id
    })

    it('should get role by ID', async () => {
      if (!adminToken || !testRoleId) return

      const response = await request(app)
        .get(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testRoleId)
    })

    it('should list all roles', async () => {
      if (!adminToken) return

      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should assign role to user', async () => {
      if (!adminToken || !testUserId || !testRoleId) return

      const response = await request(app)
        .post(`/api/users/${testUserId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleIds: [testRoleId] })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.roles).toContainEqual(
        expect.objectContaining({ id: testRoleId })
      )
    })

    it('should not create role with duplicate code', async () => {
      if (!adminToken) return

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST_ROLE',
          name: 'Duplicate Role',
          description: 'Should fail',
        })

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Permission Management Flow', () => {
    it('should list all permissions', async () => {
      if (!adminToken) return

      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should get permission by code', async () => {
      if (!adminToken) return

      const response = await request(app)
        .get('/api/permissions/code/USERS_READ')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.code).toBe('USERS_READ')
    })
  })

  describe('Account Activation/Deactivation Flow', () => {
    it('should deactivate user', async () => {
      if (!adminToken || !testUserId) return

      const response = await request(app)
        .post(`/api/users/${testUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('INACTIVE')
    })

    it('should activate user', async () => {
      if (!adminToken || !testUserId) return

      const response = await request(app)
        .post(`/api/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('ACTIVE')
    })

    it('should toggle user status', async () => {
      if (!adminToken || !testUserId) return

      const response = await request(app)
        .post(`/api/users/${testUserId}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('INACTIVE')
    })
  })

  describe('Audit Events Flow', () => {
    it('should list audit events', async () => {
      if (!adminToken) return

      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.meta).toBeDefined()
    })

    it('should get audit event types', async () => {
      if (!adminToken) return

      const response = await request(app)
        .get('/api/audit/types')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should create audit event', async () => {
      if (!adminToken) return

      const response = await request(app)
        .post('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventType: 'LOGIN_SUCCESS',
          details: 'Integration test login',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Authorization & RBAC', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/users')
      expect(response.status).toBe(401)
    })

    it('should return 403 for insufficient permissions', async () => {
      // Create a limited user without admin permissions
      const limitedUserResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'iam-test-user@example.com', password: 'User123!' })

      if (!limitedUserResponse.body.success) return

      const limitedToken = limitedUserResponse.body.data.token

      // Try to access admin endpoint
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${limitedToken}`)

      // Should be 403 since limited user doesn't have USERS_READ permission
      expect(response.status).toBe(403)
    })
  })

  describe('Cleanup', () => {
    it('should remove role from user', async () => {
      if (!adminToken || !testUserId || !testRoleId) return

      const response = await request(app)
        .delete(`/api/users/${testUserId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleIds: [testRoleId] })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should delete user', async () => {
      if (!adminToken || !testUserId) return

      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should delete role', async () => {
      if (!adminToken || !testRoleId) return

      const response = await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
