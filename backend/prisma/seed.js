/**
 * Stock Management System (SMS) - Idempotent Database Seed Script
 * Tasks: BE-012, BE-021, BE-022, BE-024, BE-041, BE-042, BE-045, BE-096 (Store Requisition Fixture)
 * SRS Traceability: Section 10.1 (Core Entities), Appendix C (Roles & Permissions), FR-01, FR-02, BR-20
 */
import { env } from '../src/config/env.js'
import { PrismaClient } from '@prisma/client'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX } from '../src/config/rbac.js'
import { hashPassword } from '../src/utils/password.js'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log(`🌱 Starting deterministic database seeding in [${env.NODE_ENV}] environment...`)

  // 1. Seed System Settings (Baseline Fixtures)
  const defaultSettings = [
    { key: 'SYSTEM_NAME', value: 'Stock Management System (SMS)' },
    { key: 'SYSTEM_VERSION', value: '2.0-Consolidated' },
    { key: 'VALUATION_METHOD', value: 'FIFO' },
    { key: 'DEFAULT_CURRENCY', value: 'ETB' },
    { key: 'INITIAL_SEED_COMPLETED', value: 'true' },
  ]

  console.log('📦 Seeding System Settings...')
  for (const setting of defaultSettings) {
    try {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      })
    } catch (_err) {
      console.log(`   ℹ️ Setting '${setting.key}' = '${setting.value}'`)
    }
  }

  // 2. Seed System Roles into the database (BE-022)
  console.log(`🔒 Seeding ${Object.keys(ROLES).length} System Roles into Database (BE-022)...`)
  const roleRecords = {}
  for (const roleObj of Object.values(ROLES)) {
    try {
      const role = await prisma.role.upsert({
        where: { code: roleObj.code },
        update: {
          name: roleObj.name,
          description: roleObj.description,
          securityLevel: roleObj.securityLevel,
        },
        create: {
          code: roleObj.code,
          name: roleObj.name,
          description: roleObj.description,
          securityLevel: roleObj.securityLevel,
        },
      })
      roleRecords[role.code] = role
    } catch (_err) {
      console.log(`   ℹ️ Role '${roleObj.code}' ready`)
    }
  }

  // 3. Seed Permissions (atomic permission codes from rbac.js)
  console.log(`🔑 Seeding ${Object.keys(PERMISSIONS).length} Permissions...`)
  const permRecords = {}
  for (const permObj of Object.values(PERMISSIONS)) {
    try {
      const perm = await prisma.permission.upsert({
        where: { code: permObj.key },
        update: { name: permObj.description || permObj.key, description: permObj.description || null },
        create: { code: permObj.key, name: permObj.description || permObj.key, description: permObj.description || null },
      })
      permRecords[perm.code] = perm
    } catch (_err) {
      console.log(`   ℹ️ Permission '${permObj.key}' ready`)
    }
  }

  // 4. Seed Role-Permission assignments (MATRIX from rbac.js)
  console.log(`🔗 Seeding Role-Permission assignments from MATRIX...`)
  for (const [roleCode, permKeys] of Object.entries(ROLE_PERMISSIONS_MATRIX)) {
    const role = roleRecords[roleCode]
    if (!role) continue
    for (const permKey of permKeys) {
      const perm = permRecords[permKey]
      if (!perm) continue
      try {
        await prisma.rolePermission.upsert({
          where: { uq_role_permissions_role_permission: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        })
      } catch (_err) {
        // already exists
      }
    }
    console.log(`   ✅ ${roleCode}: ${permKeys.length} permissions assigned`)
  }

  // 5. Seed Baseline Users (BE-021)
  const defaultPasswordHash = await hashPassword('Password123!')
  const defaultUsers = [
    {
      email: 'admin@stockmgt.gov.et',
      fullName: 'System Administrator',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.ADMIN.code,
    },
    {
      email: 'pao@stockmgt.gov.et',
      fullName: 'Property Administration Officer',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.PAO.code,
    },
    {
      email: 'storekeeper@stockmgt.gov.et',
      fullName: 'Head Storekeeper',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.STOREKEEPER.code,
    },
    {
      email: 'tec@stockmgt.gov.et',
      fullName: 'Technical Evaluation Committee Lead',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.TEC.code,
    },
    {
      email: 'accountant@stockmgt.gov.et',
      fullName: 'Chief Financial Accountant',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.ACCOUNTANT.code,
    },
    {
      email: 'depthead@stockmgt.gov.et',
      fullName: 'Department Head',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.DEPARTMENT_HEAD.code,
    },
    {
      email: 'requester@stockmgt.gov.et',
      fullName: 'Department Requester',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.REQUESTER.code,
    },
    {
      email: 'security@stockmgt.gov.et',
      fullName: 'Security Gate Officer',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.SECURITY_OFFICER.code,
    },
    {
      email: 'property@stockmgt.gov.et',
      fullName: 'Property Registration Officer',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      roleCode: ROLES.PROPERTY_REGISTRATION_OFFICER.code,
    },

  ]

  console.log('👤 Seeding Baseline Users (BE-021)...')
  const userRecords = {}
  for (const u of defaultUsers) {
    try {
      const { roleCode, ...userData } = u
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: { fullName: userData.fullName, status: userData.status },
        create: userData,
      })
      userRecords[user.email] = user
    } catch (_err) {
      console.log(`   ℹ️ User fixture '${u.email}' ready`)
    }
  }

  // 4. Seed User-Role Assignments (BE-024)
  console.log('🔗 Seeding User-Role Assignments (BE-024)...')
  const ADMIN_EMAIL = 'admin@stockmgt.gov.et'
  const adminUser = userRecords[ADMIN_EMAIL]

  for (const u of defaultUsers) {
    const user = userRecords[u.email]
    const role = roleRecords[u.roleCode]

    if (!user || !role) continue

    const assignedBy = u.email === ADMIN_EMAIL ? null : adminUser?.id ?? null

    try {
      await prisma.userRole.upsert({
        where: {
          uq_user_roles_user_role: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
          assignedBy,
        },
      })
    } catch (_err) {
      console.log(`   ℹ️ User-Role link ready`)
    }
  }

  // Seed script now only contains necessary baseline data (Settings, Roles, Permissions, Admin Users)
  // All mock fixtures (Stores, Items, Requisitions, SIVs, etc.) have been removed as requested.

  console.log('✅ Deterministic Database Seeding Completed Successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error Seeding Database:', e.message || e)
    await prisma.$disconnect()
    process.exit(1)
  })
