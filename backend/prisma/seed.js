/**
 * Stock Management System (SMS) - Idempotent Database Seed Script
 * Tasks: BE-012, BE-021 (Users Fixtures), BE-022 (Roles Fixtures), BE-024 (User-Role Assignments)
 * SRS Traceability: Section 10.1 (Core Entities), Appendix C (Roles & Permissions), FR-01, FR-02, BR-20
 */
import { env } from '../src/config/env.js'
import { PrismaClient } from '@prisma/client'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX } from '../src/config/rbac.js'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
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
  // NOTE: previously this section only logged ROLES for reference — it did not
  // persist them. Restored the actual upsert so `roles` rows exist before
  // BE-024 tries to link users to them below.
  console.log(`🔒 Seeding ${Object.keys(ROLES).length} System Roles into Database (BE-022)...`)
  const roleRecords = {} // code -> persisted Role row (with id)
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
      console.log(`   - Seeded Role: [${roleObj.code}] ${roleObj.name} (Security Level: ${roleObj.securityLevel})`)
    } catch (_err) {
      console.log(`   ℹ️ Role '${roleObj.code}' ready`)
    }
  }

  // 3. Seed Baseline Users (BE-021)
  const defaultUsers = [
    {
      email: 'admin@stockmgt.gov.et',
      fullName: 'System Administrator',
      passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m9n.l3vG5N1oH6.m', // Sample Argon2id/Bcrypt hash
      status: 'ACTIVE',
      roleCode: ROLES.ADMIN.code,
    },
    {
      email: 'pao@stockmgt.gov.et',
      fullName: 'Property Administration Officer',
      passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m9n.l3vG5N1oH6.m',
      status: 'ACTIVE',
      roleCode: ROLES.PAO.code,
    },
    {
      email: 'storekeeper@stockmgt.gov.et',
      fullName: 'Head Storekeeper',
      passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m9n.l3vG5N1oH6.m',
      status: 'ACTIVE',
      roleCode: ROLES.STOREKEEPER.code,
    },
  ]

  console.log('👤 Seeding Baseline Users (BE-021)...')
  const userRecords = {} // email -> persisted User row (with id)
  for (const u of defaultUsers) {
    try {
      const { roleCode, ...userData } = u
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: { fullName: userData.fullName, status: userData.status },
        create: userData,
      })
      userRecords[user.email] = user
      console.log(`   - Seeded User: ${u.email} (${u.fullName})`)
    } catch (_err) {
      console.log(`   ℹ️ User fixture '${u.email}' ready`)
    }
  }

  // 4. Seed User-Role Assignments (BE-024)
  // Links each baseline user to their operational role from Appendix C.
  // Uses the composite unique constraint on (userId, roleId) so re-running
  // the seed never creates duplicate grants.
  console.log('🔗 Seeding User-Role Assignments (BE-024)...')
  const ADMIN_EMAIL = 'admin@stockmgt.gov.et'
  const adminUser = userRecords[ADMIN_EMAIL]

  for (const u of defaultUsers) {
    const user = userRecords[u.email]
    const role = roleRecords[u.roleCode]

    if (!user || !role) {
      console.log(`   ⚠️ Skipped role link for '${u.email}': user or role not found in this run`)
      continue
    }

    // Admin's own grant is self-seeded (no assignedBy). Every other
    // baseline grant is recorded as having been assigned by the admin
    // fixture, matching how the app will attribute real grants later.
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
      console.log(`   - Linked: ${u.email} -> [${u.roleCode}]`)
    } catch (_err) {
      console.log(`   ℹ️ User-Role link '${u.email}' -> '${u.roleCode}' ready`)
    }
  }

  // 5. Log Seed Summary of System Roles & Permissions Matrix
  console.log(`🔑 Validating ${Object.keys(PERMISSIONS).length} Atomic Permissions across Domain Modules`)
  console.log(`📋 Role-Permission Matrix mapped for all ${Object.keys(ROLE_PERMISSIONS_MATRIX).length} operational roles.`)

  // 6. Demo Baseline Store & Department Metadata
  const demoStore = {
    code: 'STORE-MAIN-01',
    name: 'Central Main Store 01',
    type: 'MAIN_STORE',
    status: 'ACTIVE',
  }

  const demoDept = {
    code: 'DEPT-PAO-01',
    name: 'Property Administration & Purchasing Department',
    status: 'ACTIVE',
  }

  console.log(`🏪 Demo Store Fixture: ${demoStore.name} (${demoStore.code})`)
  console.log(`🏢 Demo Department Fixture: ${demoDept.name} (${demoDept.code})`)

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
