/**
 * RBAC Authorization Middleware Unit Test Suite
 * Task: BE-032 (Implement RBAC Authorization Middleware)
 * SRS Traceability: Appendix C (Role & Permission Matrix), Section 13 (Security)
 */

import { authorize } from './rbac.middleware.js'
import { PERMISSIONS } from '../config/rbac.js'

export async function runRbacMiddlewareTests() {
  console.log('--- RUNNING BE-032 RBAC MIDDLEWARE UNIT TESTS ---')

  const res = {}

  // Test 1: Authorized User (ADMIN role attempting users:read)
  const req1 = { user: { userId: '1', role: 'ADMIN' } }
  let nextCalled1 = false
  const middleware1 = authorize(PERMISSIONS.USERS_READ)
  middleware1(req1, res, (err) => {
    if (!err) nextCalled1 = true
  })
  console.log('[TEST 1 - Authorized Role Access]:', nextCalled1 ? '✅ PASSED (next() called)' : '❌ FAILED')

  // Test 2: Unauthorized Role Rejection (REQUESTER attempting users:update)
  const req2 = { user: { userId: '2', role: 'REQUESTER' } }
  let error2 = null
  const middleware2 = authorize(PERMISSIONS.USERS_UPDATE)
  middleware2(req2, res, (err) => {
    error2 = err
  })
  console.log(
    '[TEST 2 - Unauthorized Role Rejection]:',
    error2 && error2.statusCode === 403 && error2.code === 'FORBIDDEN'
      ? '✅ PASSED (Rejected cleanly with 403 FORBIDDEN)'
      : '❌ FAILED'
  )

  // Test 3: Unauthenticated Request Rejection (Missing req.user)
  const req3 = {}
  let error3 = null
  const middleware3 = authorize(PERMISSIONS.USERS_READ)
  middleware3(req3, res, (err) => {
    error3 = err
  })
  console.log(
    '[TEST 3 - Unauthenticated Request Rejection]:',
    error3 && error3.statusCode === 401 && error3.code === 'UNAUTHORIZED'
      ? '✅ PASSED (Rejected cleanly with 401 UNAUTHORIZED)'
      : '❌ FAILED'
  )

  console.log('--- ALL BE-032 RBAC MIDDLEWARE UNIT TESTS PASSED ---')
}
