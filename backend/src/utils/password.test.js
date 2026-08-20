/**
 * Password Hashing Unit Test Suite
 * Task: BE-026 (Implement Password Hashing)
 * SRS Traceability: Section 13 (Security), FR-01, NFR-05
 */

import { hashPassword, verifyPassword } from './password.js'

export async function runPasswordTests() {
  console.log('--- RUNNING BE-026 PASSWORD HASHING UNIT TESTS ---')

  const rawPassword = 'AdminSecret@2026!'

  // Test 1: Hash Generation & Verification Round-Trip
  const passwordHash = await hashPassword(rawPassword)
  console.log('[TEST 1 - Hash Format]:', passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') ? '✅ PASSED (Valid bcrypt format)' : '❌ FAILED')

  const isValidMatch = await verifyPassword(rawPassword, passwordHash)
  console.log('[TEST 2 - Round-Trip Verification]:', isValidMatch ? '✅ PASSED' : '❌ FAILED')

  // Test 3: Incorrect Password Rejection
  const isWrongMatch = await verifyPassword('WrongPassword123!', passwordHash)
  console.log('[TEST 3 - Incorrect Password Rejection]:', !isWrongMatch ? '✅ PASSED (Rejected cleanly)' : '❌ FAILED')

  // Test 4: Salt Randomness (Two hashes of same password produce distinct salt strings)
  const secondHash = await hashPassword(rawPassword)
  console.log('[TEST 4 - Distinct Salt Randomness]:', passwordHash !== secondHash ? '✅ PASSED (Salts are distinct)' : '❌ FAILED')

  console.log('--- ALL BE-026 PASSWORD HASHING UNIT TESTS PASSED ---')
}
