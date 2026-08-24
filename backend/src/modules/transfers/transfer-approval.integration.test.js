/**
 * Stock Transfer Approval REST API Integration Test Suite
 * Task: BE-125 (Implement Transfer Approval API)
 * SRS Traceability: Section 8 (Stock Transfer Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runTransferApprovalIntegrationTests() {
  console.log('--- RUNNING BE-125 TRANSFER APPROVAL API INTEGRATION TESTS ---')

  const paoUser = {
    userId: 'usr-pao-1',
    email: 'pao@stockmgt.gov.et',
    fullName: 'Property Administration Officer',
    role: 'PAO',
    status: 'ACTIVE',
  }

  const unprivilegedUser = {
    userId: 'usr-security-1',
    email: 'security@stockmgt.gov.et',
    fullName: 'Security Officer',
    role: 'SECURITY_OFFICER',
    status: 'ACTIVE',
  }

  const paoToken = issueAuthToken(paoUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3026, async () => {
    try {
      // Test 1: Transfer Approval Endpoint Authorization Pass (PAO role)
      const res1 = await fetch('http://localhost:3026/api/transfers/trf-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          notes: 'Transfer approved by PAO officer',
          isApproved: true,
        }),
      })
      // Confirms request passes authorization (status is 404 or 200, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - PAO Transfer Approval Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Unauthenticated Request Rejection
      const res2 = await fetch('http://localhost:3026/api/transfers/trf-non-existent/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      })
      const pass2 = res2.status === 401
      console.log('[TEST 2 - 401 Unauthenticated Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (SECURITY_OFFICER attempting transfers:approve)
      const res3 = await fetch('http://localhost:3026/api/transfers/trf-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ isApproved: true }),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-125 TRANSFER APPROVAL API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME TRANSFER APPROVAL INTEGRATION TESTS FAILED')
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
