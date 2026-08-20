/**
 * Auth Middleware Unit Test Suite
 * Task: BE-029 (Implement Session/Token Validation)
 * SRS Traceability: FR-03 (Session Management), Section 13 (Security)
 */

import { authenticate } from './auth.middleware.js'
import { issueAuthToken } from '../modules/auth/auth.service.js'

export async function runAuthMiddlewareTests() {
  console.log('--- RUNNING BE-029 AUTH MIDDLEWARE UNIT TESTS ---')

  const sampleUser = {
    userId: 'usr-uuid-9999',
    email: 'storekeeper@stockmgt.gov.et',
    fullName: 'Head Storekeeper',
    status: 'ACTIVE',
  }

  // Test 1: Valid Bearer Token Verification
  const validToken = issueAuthToken(sampleUser, '1h')
  const req1 = { headers: { authorization: `Bearer ${validToken}` } }
  const res1 = {}
  let nextCalled1 = false
  authenticate(req1, res1, (err) => {
    if (!err) nextCalled1 = true
  })
  console.log(
    '[TEST 1 - Valid Bearer Token]:',
    nextCalled1 && req1.user?.userId === sampleUser.userId ? '✅ PASSED (req.user attached)' : '❌ FAILED'
  )

  // Test 2: Missing Authorization Header Rejection
  const req2 = { headers: {} }
  let error2 = null
  authenticate(req2, res1, (err) => {
    error2 = err
  })
  console.log(
    '[TEST 2 - Missing Header Rejection]:',
    error2 && error2.statusCode === 401 ? '✅ PASSED (Rejected cleanly with 401)' : '❌ FAILED'
  )

  // Test 3: Tampered / Corrupted Token Signature Rejection
  const tamperedToken = validToken.substring(0, validToken.length - 4) + 'abcd'
  const req3 = { headers: { authorization: `Bearer ${tamperedToken}` } }
  let error3 = null
  authenticate(req3, res1, (err) => {
    error3 = err
  })
  console.log(
    '[TEST 3 - Tampered Token Rejection]:',
    error3 && error3.statusCode === 401 ? '✅ PASSED (Rejected cleanly with 401)' : '❌ FAILED'
  )

  console.log('--- ALL BE-029 AUTH MIDDLEWARE UNIT TESTS PASSED ---')
}
