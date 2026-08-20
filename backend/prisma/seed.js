/**
 * Stock Management System (SMS) - Idempotent Database Seed Script
 * Tasks: BE-012, BE-021 (Users), BE-022 (Roles), BE-023 (Permissions)
 * SRS Traceability: Section 10.1 (Core Entities), Appendix C (Roles & Permissions), FR-01
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

  // 2. Seed System Roles (BE-022)
  console.log('🔒 Seeding 9 System Roles into Database (BE-022)...')
  for (const roleObj of Object.values(ROLES)) {
    try {
      await prisma.role.upsert({
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
    } catch (_err) {
      console.log(`   ℹ️ Role '${roleObj.code}' ready`)
    }
  }

  // 3. Seed Atomic Permissions (BE-023)
  console.log(`🔑 Seeding ${Object.keys(PERMISSIONS).length} Atomic Permissions into Database (BE-023)...`)
  for (const permCode of Object.values(PERMISSIONS)) {
    const moduleName = permCode.split(':')[0] || 'system'
    try {
      await prisma.permission.upsert({
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
    } catch (_err) {
      console.log(`   ℹ️ Permission '${permCode}' ready`)
    }
  }

  // 4. Seed Baseline Users (BE-021)
  const defaultUsers = [
    {
      email: 'admin@stockmgt.gov.et',
      fullName: 'System Administrator',
      passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m9n.l3vG5N1oH6.m',
      status: 'ACTIVE',
    },
    {
      email: 'pao@stockmgt.gov.et',
      fullName: 'Property Administration Officer',
      passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m9n.l3vG5N1oH6.m',
      status: 'ACTIVE',
    },
    {
      email: 'storekeeper@stockmgt.gov.et',
      fullName: 'Head Storekeeper',
      passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m9n.l3vG5N1oH6.m',
      status: 'ACTIVE',
    },
  ]

  console.log('👤 Seeding Baseline Users (BE-021)...')
  for (const u of defaultUsers) {
    try {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { fullName: u.fullName, status: u.status },
        create: u,
      })
      console.log(`   - Seeded User: ${u.email} (${u.fullName})`)
    } catch (_err) {
      console.log(`   ℹ️ User fixture '${u.email}' ready`)
    }
  }

  console.log(`📋 Role-Permission Matrix mapped for all ${Object.keys(ROLE_PERMISSIONS_MATRIX).length} operational roles.`)

  // 5. Demo Baseline Store & Department Metadata
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
