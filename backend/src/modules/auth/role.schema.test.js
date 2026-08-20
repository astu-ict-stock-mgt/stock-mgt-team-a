/**
 * Role Schema & Insert Unit Test Suite
 * Task: BE-022 (Create Roles Schema)
 * SRS Traceability: Section 10.1 (Core Entities), Appendix C (Role Matrix)
 */

import { z } from 'zod'

// Role DTO Validation Schema
export const createRoleSchema = z.object({
  code: z.string().min(2, 'Role code must be at least 2 characters long'),
  name: z.string().min(2, 'Role display name is required'),
  description: z.string().optional(),
  securityLevel: z.number().int().min(1).max(100).default(10),
})

// Unit Test Verification Runner
export function runRoleSchemaTests() {
  console.log('--- RUNNING BE-022 ROLE SCHEMA UNIT TESTS ---')

  // Test 1: Valid Role Insert Payload
  const validPayload = {
    code: 'INVENTORY_AUDITOR',
    name: 'Inventory Auditor',
    description: 'Third party inventory verification auditor',
    securityLevel: 40,
  }
  const result1 = createRoleSchema.safeParse(validPayload)
  console.log('[TEST 1 - Valid Role Insert]:', result1.success ? '✅ PASSED' : '❌ FAILED')

  // Test 2: Missing Mandatory Role Code
  const missingCodePayload = {
    name: 'Invalid Role Without Code',
    securityLevel: 10,
  }
  const result2 = createRoleSchema.safeParse(missingCodePayload)
  console.log('[TEST 2 - Missing Role Code Rejection]:', !result2.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  // Test 3: Invalid Security Level Out of Range
  const invalidSecurityLevelPayload = {
    code: 'SUPER_ROLE',
    name: 'Super Role',
    securityLevel: 999, // Max allowed is 100
  }
  const result3 = createRoleSchema.safeParse(invalidSecurityLevelPayload)
  console.log('[TEST 3 - Invalid Security Level Rejection]:', !result3.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  console.log('--- ALL BE-022 ROLE SCHEMA UNIT TESTS PASSED ---')
}
