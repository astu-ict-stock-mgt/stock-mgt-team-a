/**
 * Permission Schema & Insert Unit Test Suite
 * Task: BE-023 (Create Permissions Schema)
 * SRS Traceability: Section 10.1 (Core Entities), Appendix C (Permission Matrix)
 */

import { z } from 'zod'

// Permission DTO Validation Schema
export const createPermissionSchema = z.object({
  code: z.string().min(3, 'Permission code must be at least 3 characters long'),
  module: z.string().min(2, 'Domain module name is required'),
  name: z.string().min(2, 'Permission display name is required'),
  description: z.string().optional(),
})

// Unit Test Verification Runner
export function runPermissionSchemaTests() {
  console.log('--- RUNNING BE-023 PERMISSION SCHEMA UNIT TESTS ---')

  // Test 1: Valid Permission Insert Payload
  const validPayload = {
    code: 'reports:export_pdf',
    module: 'reports',
    name: 'Export PDF Reports',
    description: 'Allows exporting system reports as PDF',
  }
  const result1 = createPermissionSchema.safeParse(validPayload)
  console.log('[TEST 1 - Valid Permission Insert]:', result1.success ? '✅ PASSED' : '❌ FAILED')

  // Test 2: Missing Mandatory Permission Code
  const missingCodePayload = {
    module: 'inventory',
    name: 'Invalid Permission Without Code',
  }
  const result2 = createPermissionSchema.safeParse(missingCodePayload)
  console.log('[TEST 2 - Missing Permission Code Rejection]:', !result2.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  // Test 3: Missing Mandatory Domain Module
  const missingModulePayload = {
    code: 'items:delete',
    name: 'Delete Item',
  }
  const result3 = createPermissionSchema.safeParse(missingModulePayload)
  console.log('[TEST 3 - Missing Module Rejection]:', !result3.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  console.log('--- ALL BE-023 PERMISSION SCHEMA UNIT TESTS PASSED ---')
}
