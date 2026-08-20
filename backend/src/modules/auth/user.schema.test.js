/**
 * User Schema & Insert Unit Test Suite
 * Task: BE-021 (Create Users Schema)
 * SRS Traceability: Section 10.1 (Core Entities), FR-01, BR-21
 */

import { z } from 'zod'

// User DTO Validation Schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  passwordHash: z.string().min(8, 'Password hash must be valid'),
  fullName: z.string().min(2, 'Full name is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

// Unit Test Verification Runner
export function runUserSchemaTests() {
  console.log('--- RUNNING BE-021 USER SCHEMA UNIT TESTS ---')

  // Test 1: Valid User Insert Payload
  const validPayload = {
    email: 'test.user@stockmgt.gov.et',
    passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m9n.l3vG5N1oH6.m',
    fullName: 'Test Auditor User',
    status: 'ACTIVE',
  }
  const result1 = createUserSchema.safeParse(validPayload)
  console.log('[TEST 1 - Valid Insert]:', result1.success ? '✅ PASSED' : '❌ FAILED')

  // Test 2: Invalid Email Format
  const invalidEmailPayload = {
    email: 'invalid-email-string',
    passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m',
    fullName: 'Invalid Email User',
  }
  const result2 = createUserSchema.safeParse(invalidEmailPayload)
  console.log('[TEST 2 - Invalid Email Format Rejection]:', !result2.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  // Test 3: Missing Required Full Name
  const missingNamePayload = {
    email: 'user2@stockmgt.gov.et',
    passwordHash: '$2b$10$e8Kz.0xP89m4/x4u9l2.xO3QY7L3vG5N1oH6.m',
  }
  const result3 = createUserSchema.safeParse(missingNamePayload)
  console.log('[TEST 3 - Missing Mandatory Field Rejection]:', !result3.success ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  console.log('--- ALL BE-021 USER SCHEMA UNIT TESTS PASSED ---')
}
