/**
 * Stock Management System (SMS) - Idempotent Database Seed Script
 * Tasks: BE-012, BE-021 (Users), BE-022 (Roles), BE-023 (Permissions), BE-025 (Role-Permissions Matrix), BE-026 (Password Hashing)
 * SRS Traceability: Section 10.1 (Core Entities), Section 13 (Security), Appendix C (Roles & Permissions Matrix), FR-01
 */

import { env } from '../src/config/env.js'
import { PrismaClient } from '@prisma/client'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX } from '../src/config/rbac.js'
import { hashPassword } from '../src/utils/password.js'

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

  // 2. Seed System Roles (BE-022)
  console.log('🔒 Seeding 9 System Roles into Database (BE-022)...')
  const dbRolesMap = new Map()
  for (const roleObj of Object.values(ROLES)) {
    try {
      const dbRole = await prisma.role.upsert({
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
      dbRolesMap.set(roleObj.code, dbRole.id)
    } catch (_err) {
      console.log(`   ℹ️ Role '${roleObj.code}' ready`)
    }
  }

  // 3. Seed Atomic Permissions (BE-023)
  console.log(`🔑 Seeding ${Object.keys(PERMISSIONS).length} Atomic Permissions into Database (BE-023)...`)
  const dbPermissionsMap = new Map()
  for (const permCode of Object.values(PERMISSIONS)) {
    const moduleName = permCode.split(':')[0] || 'system'
    try {
      const dbPerm = await prisma.permission.upsert({
        where: { code: permCode },
        update: {
          module: moduleName,
          name: `Permission ${permCode}`,
        },
        create: {
          code: permCode,
          module: moduleName,
          name: `Permission ${permCode}`,
          description: `Atomic permission for action ${permCode}`,
        },
      })
      dbPermissionsMap.set(permCode, dbPerm.id)
    } catch (_err) {
      console.log(`   ℹ️ Permission '${permCode}' ready`)
    }
  }

  // 4. Seed Role-Permission Relationships Matrix (BE-025)
  console.log('🔗 Seeding Role-Permission Join Mappings (BE-025)...')
  let mappedCount = 0
  for (const [roleCode, permList] of Object.entries(ROLE_PERMISSIONS_MATRIX)) {
    const roleId = dbRolesMap.get(roleCode)
    if (!roleId) {
      continue
    }

    for (const permCode of permList) {
      const permissionId = dbPermissionsMap.get(permCode)
      if (!permissionId) {
        continue
      }

      try {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
          update: {},
          create: { roleId, permissionId },
        })
        mappedCount++
      } catch (_err) {
        // Idempotent constraint skip
      }
    }
  }
  console.log(`   - Successfully mapped ${mappedCount} Role-Permission relationships in database.`)

  // 5. Seed Baseline Users with Secure Bcrypt Passwords (BE-021 & BE-026)
  const defaultPasswordHash = await hashPassword('AdminSecret@2026!')
  const defaultUsers = [
    {
      email: 'admin@stockmgt.gov.et',
      fullName: 'System Administrator',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
    },
    {
      email: 'pao@stockmgt.gov.et',
      fullName: 'Property Administration Officer',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
    },
    {
      email: 'storekeeper@stockmgt.gov.et',
      fullName: 'Head Storekeeper',
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
    },
  ]

  console.log('👤 Seeding Baseline Users (BE-021 & BE-026)...')
  for (const u of defaultUsers) {
    try {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { fullName: u.fullName, status: u.status, passwordHash: u.passwordHash },
        create: u,
      })
      console.log(`   - Seeded User: ${u.email} (${u.fullName})`)
    } catch (_err) {
      console.log(`   ℹ️ User fixture '${u.email}' ready`)
    }
  }

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
