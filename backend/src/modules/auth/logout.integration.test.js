/**
 * Logout REST API & Session Revocation Integration Test Suite
 * Task: BE-030 (Implement Logout/Session Revocation)
 * SRS Traceability: FR-03 (Session Management), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from './auth.service.js'

export async function runLogoutIntegrationTests() {
  console.log('--- RUNNING BE-030 LOGOUT API INTEGRATION TESTS ---')

  const testUser = {
    userId: 'usr-uuid-logout-test',
    email: 'logout.user@stockmgt.gov.et',
    fullName: 'Logout Test User',
    status: 'ACTIVE',
  }

  const token = issueAuthToken(testUser, '1h')

  const server = app.listen(3010, async () => {
    try {
      // Test 1: Active Token Access to GET /api/auth/me -> 200 OK
      const res1 = await fetch('http://localhost:3010/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const pass1 = res1.status === 200
      console.log('[TEST 1 - Active Token Access]:', pass1 ? '✅ PASSED' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Execute Logout POST /api/auth/logout -> 200 OK
      const res2 = await fetch('http://localhost:3010/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const pass2 = res2.status === 200
      console.log('[TEST 2 - Logout Execution]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Reusing Revoked Token GET /api/auth/me -> 401 Unauthorized
      const res3 = await fetch('http://localhost:3010/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const pass3 = res3.status === 401
      console.log('[TEST 3 - Revoked Token Access Rejection]:', pass3 ? '✅ PASSED (Rejected with 401)' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-030 LOGOUT API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME LOGOUT INTEGRATION TESTS FAILED')
      }

      server.close()
      process.exit(allPassed ? 0 : 1)
    } catch (err) {
      console.error('❌ Integration Test Error:', err)
      server.close()
      process.exit(1)
    }
  })
}
