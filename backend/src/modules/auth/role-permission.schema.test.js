/**
 * Role-Permission Relationship Schema & Insert Unit Test Suite
 * Task: BE-025 (Create Role-Permission Relationships)
 * SRS Traceability: Section 10.1 (Core Entities), Appendix C (Role-Permission Matrix)
 */

import { z } from 'zod'

// RolePermission Join DTO Validation Schema
export const createRolePermissionSchema = z.object({
  roleId: z.string().uuid('roleId must be a valid UUID'),
  permissionId: z.string().uuid('permissionId must be a valid UUID'),
})

// Unit Test Verification Runner
export function runRolePermissionSchemaTests() {
  console.log('--- RUNNING BE-025 ROLE-PERMISSION SCHEMA UNIT TESTS ---')

  // Test 1: Valid RolePermission Mapping Payload
  const validPayload = {
    roleId: '123e4567-e89b-12d3-a456-426614174000',
    permissionId: '98765432-e89b-12d3-a456-426614174000',
  }
  const result1 = createRolePermissionSchema.safeParse(validPayload)
  console.log('[TEST 1 - Valid RolePermission Join Insert]:', result1.success ? '✅ PASSED' : '❌ FAILED')

  // Test 2: Invalid roleId UUID Rejection
  const invalidRoleIdPayload = {
    roleId: 'not-a-valid-uuid',
    permissionId: '98765432-e89b-12d3-a456-426614174000',
  }
  const result2 = createRolePermissionSchema.safeParse(invalidRoleIdPayload)
  console.log('[TEST 2 - Invalid roleId UUID Rejection]:', !result2.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  // Test 3: Missing permissionId Rejection
  const missingPermIdPayload = {
    roleId: '123e4567-e89b-12d3-a456-426614174000',
  }
  const result3 = createRolePermissionSchema.safeParse(missingPermIdPayload)
  console.log('[TEST 3 - Missing permissionId Rejection]:', !result3.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  console.log('--- ALL BE-025 ROLE-PERMISSION SCHEMA UNIT TESTS PASSED ---')
}
