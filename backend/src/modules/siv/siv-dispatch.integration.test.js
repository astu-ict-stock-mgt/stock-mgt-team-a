/**
 * Gate / Dispatch Verification REST API Integration Test Suite
 * Task: BE-111 (Implement Gate/Dispatch Verification API)
 * SRS Traceability: Section 6 (Store Issue & Gate Pass Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runSivDispatchIntegrationTests() {
  console.log('--- RUNNING BE-111 GATE DISPATCH VERIFICATION API INTEGRATION TESTS ---')

  const securityOfficer = {
    userId: 'usr-security-1',
    email: 'security@stockmgt.gov.et',
    fullName: 'Security Officer',
    role: 'SECURITY_OFFICER',
    status: 'ACTIVE',
  }

  const unprivilegedUser = {
    userId: 'usr-requester-1',
    email: 'requester@stockmgt.gov.et',
    fullName: 'Department Requester',
    role: 'REQUESTER',
    status: 'ACTIVE',
  }

  const securityToken = issueAuthToken(securityOfficer, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3020, async () => {
    try {
      // Test 1: Gate Dispatch Verification Authorization Pass (SECURITY_OFFICER role)
      const res1 = await fetch('http://localhost:3020/api/sivs/siv-non-existent/verify-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${securityToken}`,
        },
        body: JSON.stringify({
          gateNumber: 'GATE-01',
          vehicleNumber: 'ET-3-12345',
          driverName: 'Abebe Kebede',
        }),
      })
      // Confirms request passes authorization (status is 404 or 200/409, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Security Officer Dispatch Verification Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Unauthenticated Request Rejection
      const res2 = await fetch('http://localhost:3020/api/sivs/siv-non-existent/verify-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateNumber: 'GATE-01' }),
      })
      const pass2 = res2.status === 401
      console.log('[TEST 2 - 401 Unauthenticated Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (REQUESTER attempting dispatch:verify)
      const res3 = await fetch('http://localhost:3020/api/sivs/siv-non-existent/verify-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ gateNumber: 'GATE-01' }),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-111 GATE DISPATCH VERIFICATION API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME GATE DISPATCH INTEGRATION TESTS FAILED')
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
