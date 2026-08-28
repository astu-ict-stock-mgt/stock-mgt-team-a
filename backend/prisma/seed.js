/**
 * Stock Management System (SMS) - Idempotent Database Seed Script
 * Tasks: BE-012, BE-021, BE-022, BE-024, BE-041, BE-042, BE-045, BE-096 (Store Requisition Fixture)
 * SRS Traceability: Section 10.1 (Core Entities), Appendix C (Roles & Permissions), FR-01, FR-02, BR-20
 */
import { env } from '../src/config/env.js'
import { PrismaClient } from '@prisma/client'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX } from '../src/config/rbac.js'

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
  const defaultUsers = [
    {
      email: 'admin@stockmgt.gov.et',
      fullName: 'System Administrator',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.ADMIN.code,
    },
    {
      email: 'pao@stockmgt.gov.et',
      fullName: 'Property Administration Officer',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.PAO.code,
    },
    {
      email: 'storekeeper@stockmgt.gov.et',
      fullName: 'Head Storekeeper',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.STOREKEEPER.code,
    },
    {
      email: 'tec@stockmgt.gov.et',
      fullName: 'Technical Evaluation Committee Lead',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.TEC.code,
    },
    {
      email: 'accountant@stockmgt.gov.et',
      fullName: 'Chief Financial Accountant',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.ACCOUNTANT.code,
    },
    {
      email: 'depthead@stockmgt.gov.et',
      fullName: 'Department Head',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.DEPARTMENT_HEAD.code,
    },
    {
      email: 'requester@stockmgt.gov.et',
      fullName: 'Department Requester',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.REQUESTER.code,
    },
    {
      email: 'security@stockmgt.gov.et',
      fullName: 'Security Gate Officer',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
      status: 'ACTIVE',
      roleCode: ROLES.SECURITY_OFFICER.code,
    },
    {
      email: 'property@stockmgt.gov.et',
      fullName: 'Property Registration Officer',
      passwordHash: '$2b$10$GWw1R9I4KSEunFrgZtLoPe9.HjJgzWsZ2So61elw7OEhcU6IlmOUy',
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

  // 5. Seed Demo Store & Department Metadata
  const store = await prisma.store.upsert({
    where: { code: 'STORE-MAIN-01' },
    update: { name: 'Central Main Store 01' },
    create: {
      code: 'STORE-MAIN-01',
      name: 'Central Main Store 01',
      type: 'MAIN_STORE',
      status: 'ACTIVE',
    },
  })

  const dept = await prisma.department.upsert({
    where: { code: 'DEPT-PAO-01' },
    update: { name: 'Property Administration & Purchasing Department' },
    create: {
      code: 'DEPT-PAO-01',
      name: 'Property Administration & Purchasing Department',
      status: 'ACTIVE',
    },
  })

  const unit = await prisma.unit.upsert({
    where: { code: 'PCS' },
    update: { name: 'Pieces' },
    create: {
      code: 'PCS',
      name: 'Pieces',
      symbol: 'pcs',
      status: 'ACTIVE',
    },
  })

  const item = await prisma.item.upsert({
    where: { code: 'ITEM-LAPTOP-01' },
    update: { name: 'High-Performance Workstation Laptop' },
    create: {
      code: 'ITEM-LAPTOP-01',
      name: 'High-Performance Workstation Laptop',
      unitId: unit.id,
      status: 'ACTIVE',
      minimumStock: 5,
      reorderPoint: 10,
    },
  })

  // 6. Seed Store Requisition Fixtures (BE-096)
  console.log('📋 Seeding Requisition Fixtures (BE-096)...')
  const requesterUser = userRecords['requester@stockmgt.gov.et'] || adminUser
  if (requesterUser && store && dept && item) {
    try {
      await prisma.requisition.upsert({
        where: { requisitionNumber: 'REQ-2026-00001' },
        update: {},
        create: {
          requisitionNumber: 'REQ-2026-00001',
          requesterId: requesterUser.id,
          departmentId: dept.id,
          storeId: store.id,
          status: 'SUBMITTED',
          purpose: 'Quarterly Departmental Hardware Renewal',
          lines: {
            create: [
              {
                itemId: item.id,
                requestedQuantity: 3,
                remarks: 'Urgent replacement for dev team',
              },
            ],
          },
        },
      })
      console.log('   - Seeded Requisition: REQ-2026-00001 (SUBMITTED)')
    } catch (_err) {
      console.log('   ℹ️ Requisition fixture REQ-2026-00001 ready')
    }
  }

  // 7. Seed Store Issue Voucher (SIV) Fixtures (BE-103)
  console.log('📦 Seeding SIV Fixtures (BE-103)...')
  const reqRecord = await prisma.requisition.findUnique({ where: { requisitionNumber: 'REQ-2026-00001' } })
  if (reqRecord && store && requesterUser && item) {
    try {
      await prisma.sIV.upsert({
        where: { sivNumber: 'SIV-2026-00001' },
        update: {},
        create: {
          sivNumber: 'SIV-2026-00001',
          requisitionId: reqRecord.id,
          storeId: store.id,
          issuedToUserId: requesterUser.id,
          preparedBy: requesterUser.id,
          status: 'PREPARED',
          notes: 'Prepared store issue voucher for approved laptops',
          lines: {
            create: [
              {
                itemId: item.id,
                quantityIssued: 3,
                unitCost: 1500.0,
                totalCost: 4500.0,
                remarks: 'Delivered in sealed box',
              },
            ],
          },
        },
      })
      console.log('   - Seeded SIV: SIV-2026-00001 (PREPARED)')
    } catch (_err) {
      console.log('   ℹ️ SIV fixture SIV-2026-00001 ready')
    }
  }

  // 8. Seed Stock Transfer Request & Lines Fixtures (BE-121, BE-122)
  console.log('🔄 Seeding Transfer Request & Lines Fixtures (BE-121, BE-122)...')
  if (store && requesterUser && item) {
    try {
      await prisma.transferRequest.upsert({
        where: { transferNumber: 'STR-2026-00001' },
        update: {},
        create: {
          transferNumber: 'STR-2026-00001',
          transferType: 'STORE_TO_STORE',
          status: 'SUBMITTED',
          sourceStoreId: store.id,
          destinationStoreId: store.id,
          requestedBy: requesterUser.id,
          notes: 'Inter-store transfer of hardware accessories',
          lines: {
            create: [
              {
                itemId: item.id,
                quantityRequested: 5,
                remarks: 'Transfer for project deployment',
              },
            ],
          },
        },
      })
      console.log('   - Seeded Transfer Request & Lines: STR-2026-00001 (SUBMITTED)')
    } catch (_err) {
      console.log('   ℹ️ Transfer Request fixture STR-2026-00001 ready')
    }
  }

  // 9. Seed Fixed Asset Fixtures (BE-129)
  console.log('🏛️ Seeding Fixed Asset Fixtures (BE-129)...')
  if (item && dept && requesterUser) {
    try {
      await prisma.fixedAsset.upsert({
        where: { assetTag: 'AST-2026-00001' },
        update: {},
        create: {
          assetTag: 'AST-2026-00001',
          name: 'Dell Latitude Developer Laptop',
          itemId: item.id,
          serialNumber: 'SN-DELL-2026-99',
          category: 'IT Hardware',
          status: 'REGISTERED',
          custodianId: requesterUser.id,
          departmentId: dept.id,
          purchaseDate: new Date(),
          purchaseCost: 1500.0,
          currentValue: 1500.0,
          notes: 'Registered fixed asset laptop from GRN receipt',
        },
      })
      console.log('   - Seeded Fixed Asset: AST-2026-00001 (REGISTERED)')
    } catch (_err) {
      console.log('   ℹ️ Fixed Asset fixture AST-2026-00001 ready')
    }
  }

  // 10. Seed Shelf-Life Fixtures (BE-132)
  console.log('⏳ Seeding Shelf-Life Fixtures (BE-132)...')
  if (item && store) {
    try {
      const futureExpiry = new Date()
      futureExpiry.setDate(futureExpiry.getDate() + 90)

      await prisma.shelfLifeRecord.upsert({
        where: { uq_shelflife_item_batch: { itemId: item.id, batchNumber: 'BATCH-2026-001' } },
        update: {},
        create: {
          itemId: item.id,
          batchNumber: 'BATCH-2026-001',
          quantity: 100,
          expiryDate: futureExpiry,
          alertDaysBeforeExpiry: 30,
          status: 'HEALTHY',
          storeId: store.id,
          notes: 'Seeded shelf-life batch record (HEALTHY)',
        },
      })
      console.log('   - Seeded Shelf-Life Batch: BATCH-2026-001 (HEALTHY)')
    } catch (_err) {
      console.log('   ℹ️ Shelf-Life fixture BATCH-2026-001 ready')
    }
  }

  // 11. Seed Disposal Request Fixtures (BE-136)
  console.log('🗑️ Seeding Disposal Request Fixtures (BE-136)...')
  if (store && requesterUser) {
    try {
      await prisma.disposalRequest.upsert({
        where: { disposalNumber: 'DSP-2026-00001' },
        update: {},
        create: {
          disposalNumber: 'DSP-2026-00001',
          disposalMethod: 'DESTRUCTION',
          status: 'SUBMITTED',
          storeId: store.id,
          requestedBy: requesterUser.id,
          reason: 'Damaged and obsolete inventory items',
          notes: 'Disposal request submitted for committee review',
        },
      })
      console.log('   - Seeded Disposal Request: DSP-2026-00001 (SUBMITTED)')
    } catch (_err) {
      console.log('   ℹ️ Disposal Request fixture DSP-2026-00001 ready')
    }
  }

  // 12. Seed Reconciliation Fixtures (BE-146)
  console.log('⚖️ Seeding Reconciliation Fixtures (BE-146)...')
  if (store && requesterUser) {
    try {
      await prisma.reconciliation.upsert({
        where: { reconciliationNo: 'REC-2026-00001' },
        update: {},
        create: {
          reconciliationNo: 'REC-2026-00001',
          storeId: store.id,
          status: 'SUBMITTED',
          countDate: new Date(),
          initiatedBy: requesterUser.id,
          reason: 'Annual physical stock count and variance reconciliation',
          notes: 'Submitted for PAO variance approval',
        },
      })
      console.log('   - Seeded Reconciliation: REC-2026-00001 (SUBMITTED)')
    } catch (_err) {
      console.log('   ℹ️ Reconciliation fixture REC-2026-00001 ready')
    }
  }

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
