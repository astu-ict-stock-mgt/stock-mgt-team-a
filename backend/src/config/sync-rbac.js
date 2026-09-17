import { prisma } from './database.js'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX } from './rbac.js'
import { invalidatePermissionCache } from './permission-cache.js'

async function sync() {
  console.log('🔄 Syncing RBAC Role-Permissions with Database...')

  // 1. Upsert all roles to ensure role records are present
  const roleRecords = {}
  for (const roleObj of Object.values(ROLES)) {
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
  }

  // 2. Upsert all permission codes from PERMISSIONS catalog
  const permRecords = {}
  for (const permObj of Object.values(PERMISSIONS)) {
    const perm = await prisma.permission.upsert({
      where: { code: permObj.key },
      update: {
        name: permObj.description || permObj.key,
        description: permObj.description || null,
      },
      create: {
        code: permObj.key,
        name: permObj.description || permObj.key,
        description: permObj.description || null,
      },
    })
    permRecords[perm.code] = perm
  }

  // 3. Clear all old role-permission connections
  console.log('🧹 Clearing old RolePermission records...')
  await prisma.rolePermission.deleteMany({})

  // 4. Re-assign permissions according to the new matrix (with deduplication)
  console.log('🔗 Writing new RolePermission assignments...')
  let count = 0
  for (const [roleCode, permKeys] of Object.entries(ROLE_PERMISSIONS_MATRIX)) {
    const role = roleRecords[roleCode]
    if (!role) {
      console.warn(`⚠️ Role ${roleCode} not found in DB`)
      continue
    }

    const uniquePermKeys = [...new Set(permKeys)]
    for (const permKey of uniquePermKeys) {
      const perm = permRecords[permKey]
      if (!perm) {
        console.warn(`⚠️ Permission ${permKey} not found in DB`)
        continue
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        },
      })
      count++
    }
    console.log(`   ✅ Synced role [${roleCode}]: ${uniquePermKeys.length} permissions mapped`)
  }

  // 5. Invalidate Permission Cache in memory
  invalidatePermissionCache()
  console.log(`🎉 Successfully synced database! Total ${count} permission assignments written.`)
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
