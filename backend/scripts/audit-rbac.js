/**
 * Static RBAC Route Audit Tool
 * Scans all Express route files for authorize(...) middleware calls,
 * resolves permission keys, and verifies:
 * 1. The key exists in PERMISSIONS catalog (backend/src/config/rbac.js).
 * 2. The key is granted to at least one role in ROLE_PERMISSIONS_MATRIX
 *    (either directly or via `<module>:manage` fallback).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PERMISSIONS, ROLE_PERMISSIONS_MATRIX, ALL_PERMISSION_KEYS } from '../src/config/rbac.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const srcDir = path.resolve(__dirname, '../src')

// Collect all permission keys that are actually granted across all roles (direct or fallback)
const grantedPermissions = new Set()
for (const perms of Object.values(ROLE_PERMISSIONS_MATRIX)) {
  for (const p of perms) {
    grantedPermissions.add(p)
  }
}

function findRouteFiles(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      results = results.concat(findRouteFiles(filePath))
    } else if (file.endsWith('.routes.js')) {
      results.push(filePath)
    }
  }
  return results
}

function normalizeKey(rawKey) {
  if (rawKey.includes('.') && !rawKey.includes(':')) {
    return rawKey.replace(/\./g, ':')
  }
  return rawKey
}

function resolvePermissionExpression(expr) {
  expr = expr.trim()
  // Remove wrapping brackets if any
  if (expr.startsWith('[') && expr.endsWith(']')) {
    const inner = expr.slice(1, -1)
    return inner.split(',').map(s => resolvePermissionExpression(s)).flat()
  }

  // Handle string literals
  const stringMatch = expr.match(/^['"]([^'"]+)['"]$/)
  if (stringMatch) {
    return [normalizeKey(stringMatch[1])]
  }

  // Handle PERMISSIONS.X or PERMISSIONS.X.key
  const permMatch = expr.match(/PERMISSIONS\.([A-Z0-9_]+)(?:\.key)?/)
  if (permMatch) {
    const permConst = PERMISSIONS[permMatch[1]]
    if (permConst) {
      return [permConst.key]
    }
    return [`UNKNOWN_PERMISSION:${permMatch[1]}`]
  }

  return [normalizeKey(expr.replace(/['"]/g, ''))]
}

function audit() {
  console.log('🔍 Starting RBAC Static Route Audit...')
  const routeFiles = findRouteFiles(srcDir)
  console.log(`📂 Found ${routeFiles.length} route files in src/`)

  const errors = []
  let totalChecked = 0

  const authorizeRegex = /authorize\(([^)]+)\)/g

  for (const filePath of routeFiles) {
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath)
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')

    lines.forEach((line, lineIdx) => {
      let match
      authorizeRegex.lastIndex = 0
      while ((match = authorizeRegex.exec(line)) !== null) {
        const rawArg = match[1]
        const resolvedKeys = resolvePermissionExpression(rawArg)

        for (const key of resolvedKeys) {
          totalChecked++
          const [module, action] = key.split(':')
          const manageKey = `${module}:manage`

          // 1. Check if permission exists in catalog
          const existsInCatalog = ALL_PERMISSION_KEYS.includes(key)
          if (!existsInCatalog) {
            errors.push({
              file: relPath,
              line: lineIdx + 1,
              raw: rawArg,
              key,
              reason: `Permission key '${key}' does not exist in PERMISSIONS catalog`,
            })
            continue
          }

          // 2. Check if granted to at least one role (directly or via manage)
          const isDirectlyGranted = grantedPermissions.has(key)
          const isManageGranted = action !== 'manage' && grantedPermissions.has(manageKey)

          if (!isDirectlyGranted && !isManageGranted) {
            errors.push({
              file: relPath,
              line: lineIdx + 1,
              raw: rawArg,
              key,
              reason: `Permission key '${key}' is defined in catalog but not granted to ANY role (directly or via '${manageKey}')`,
            })
          }
        }
      }
    })
  }

  console.log(`\n📊 Audit Summary:`)
  console.log(`   Total authorize() permission checks audited: ${totalChecked}`)

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} RBAC route violation(s):`)
    errors.forEach((err, idx) => {
      console.error(`\n ${idx + 1}. [${err.file}:${err.line}]`)
      console.error(`    Raw call: authorize(${err.raw})`)
      console.error(`    Resolved Key: '${err.key}'`)
      console.error(`    Error: ${err.reason}`)
    })
    process.exit(1)
  } else {
    console.log(`\n✅ All ${totalChecked} route permission checks passed validation! Zero RBAC dead routes found.`)
    process.exit(0)
  }
}

audit()
