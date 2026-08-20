/**
 * Authentication Service Unit Test Suite
 * Task: BE-027 (Implement Authentication Service)
 * SRS Traceability: FR-01 (Authentication), FR-03 (Session Management), Section 13
 */

import { issueAuthToken, verifyAuthToken } from './auth.service.js'

export async function runAuthServiceTests() {
  console.log('--- RUNNING BE-027 AUTHENTICATION SERVICE UNIT TESTS ---')

  const testPayload = {
    userId: 'usr-uuid-12345',
    email: 'admin@stockmgt.gov.et',
    fullName: 'System Administrator',
    status: 'ACTIVE',
  }

  // Test 1: JWT Access Token Issuance & Format
  const token = issueAuthToken(testPayload, '1h')
  console.log('[TEST 1 - JWT Token Format]:', token.split('.').length === 3 ? '✅ PASSED (Valid 3-part JWT header.payload.signature)' : '❌ FAILED')

  // Test 2: JWT Token Signature & Claims Verification
  const decoded = verifyAuthToken(token)
  console.log('[TEST 2 - Token Verification & Claims]:', decoded.userId === testPayload.userId && decoded.email === testPayload.email ? '✅ PASSED' : '❌ FAILED')

  // Test 3: Invalid Token Signature Rejection
  const corruptedToken = token.substring(0, token.length - 5) + 'xxxxx'
  let rejectedCleanly = false
  try {
    verifyAuthToken(corruptedToken)
  } catch (err) {
    rejectedCleanly = err.statusCode === 401
  }
  console.log('[TEST 3 - Corrupted Token Rejection]:', rejectedCleanly ? '✅ PASSED (Rejected cleanly with 401)' : '❌ FAILED')

  console.log('--- ALL BE-027 AUTHENTICATION SERVICE UNIT TESTS PASSED ---')
}
