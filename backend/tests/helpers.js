import { PrismaClient } from '@prisma/client'
import express from 'express'

const prisma = new PrismaClient()

/**
 * Create a test-specific Prisma client
 * Each test gets its own client instance for isolation
 */
export function createTestPrisma() {
  return new PrismaClient()
}

/**
 * Transaction rollback wrapper
 *
 * Wraps a test callback inside a database transaction that is rolled back
 * after the test completes. This ensures:
 * 1. Each test starts with a clean state
 * 2. Tests don't interfere with each other
 * 3. No cleanup needed after tests
 *
 * Usage:
 *   await withRollback(async (tx) => {
 *     // use tx (Prisma client) for all DB operations
 *     const user = await tx.user.create({ data: { ... } })
 *     expect(user).toBeDefined()
 *   })
 */
export async function withRollback(callback) {
  const client = createTestPrisma()

  try {
    // Execute the test inside a transaction
    await client.$transaction(async (tx) => {
      try {
        await callback(tx)
      } finally {
        // Always rollback - even if test fails
        // This is implicit in Prisma's $transaction - if the callback throws, it rolls back
        throw new Error('__ROLLBACK__')
      }
    })
  } catch (error) {
    // The rollback error is expected - ignore it
    if (error.message !== '__ROLLBACK__') {
      throw error
    }
  } finally {
    await client.$disconnect()
  }
}

/**
 * Seed test data
 * Creates minimal test data needed for most tests
 */
export async function seedTestData(tx) {
  // Create a test role
  const role = await tx.role.create({
    data: {
      name: 'TEST_ADMIN',
      description: 'Test administrator role'
    }
  })

  // Create a test user
  const user = await tx.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed_password_here',
      firstName: 'Test',
      lastName: 'User',
      roleId: role.id
    }
  })

  // Create a test store
  const store = await tx.store.create({
    data: {
      name: 'Test Store',
      code: 'TEST-STORE-001',
      type: 'MAIN',
      status: 'ACTIVE'
    }
  })

  return { role, user, store }
}

/**
 * Clean all tables (use with caution - prefer withRollback)
 * Only use in global setup/teardown, not per-test
 */
export async function cleanDatabase() {
  const tables = [
    'audit_logs',
    'notifications',
    'bin_transactions',
    'stock_card_transactions',
    'bin_cards',
    'stock_cards',
    'disposal_requests',
    'shelf_life_records',
    'transfer_lines',
    'transfer_requests',
    'return_lines',
    'returns',
    'siv_isiv_lines',
    'siv_isiv',
    'requisition_lines',
    'requisitions',
    'grns',
    'technical_evaluations',
    'goods_receipt_lines',
    'goods_receipts',
    'fixed_assets',
    'inventory_adjustments',
    'stock_take_lines',
    'stock_takes',
    'locations',
    'suppliers',
    'items',
    'units_of_measure',
    'categories',
    'store_departments',
    'stores',
    'user_roles',
    'permissions',
    'roles',
    'users'
  ]

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
    } catch {
      // Table might not exist yet
    }
  }
}

/**
 * Create Express app for testing
 * Imports and configures the app without starting the server
 */
export async function createTestApp() {
  // Dynamic import to avoid issues with module resolution
  const { default: app } = await import('../src/index.js')
  return app
}

export { prisma }
export default { withRollback, seedTestData, cleanDatabase, createTestPrisma, createTestApp, prisma }
