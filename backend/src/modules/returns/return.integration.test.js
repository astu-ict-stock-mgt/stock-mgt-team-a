/**
 * Stock Return Note (SRN / Return) REST API Integration Test Suite
 * Task: BE-117 (Implement Return Request APIs)
 * SRS Traceability: Section 7 (Stock Return Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runReturnIntegrationTests() {
  console.log('--- RUNNING BE-117 RETURN REQUEST API INTEGRATION TESTS ---')

  const requesterUser = {
    userId: 'usr-requester-1',
    email: 'requester@stockmgt.gov.et',
    fullName: 'Department Requester',
    role: 'REQUESTER',
    status: 'ACTIVE',
  }

  const unprivilegedUser = {
    userId: 'usr-security-1',
    email: 'security@stockmgt.gov.et',
    fullName: 'Security Officer',
    role: 'SECURITY_OFFICER',
    status: 'ACTIVE',
  }

  const requesterToken = issueAuthToken(requesterUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3022, async () => {
    try {
      // Test 1: Return Request Authorization Pass (Requester role)
      const res1 = await fetch('http://localhost:3022/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${requesterToken}`,
        },
        body: JSON.stringify({
          storeId: 'store-1',
          reason: 'UNUSED',
          lines: [{ itemId: 'item-1', quantityReturned: 2 }],
        }),
      })
      // Confirms request passes authorization (status is 404/201, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Return Creation Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Empty lines array)
      const res2 = await fetch('http://localhost:3022/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${requesterToken}`,
        },
        body: JSON.stringify({
          storeId: 'store-1',
          lines: [],
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Empty Lines Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthenticated Request Rejection
      const res3 = await fetch('http://localhost:3022/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store-1',
          lines: [{ itemId: 'item-1', quantityReturned: 2 }],
        }),
      })
      const pass3 = res3.status === 401
      console.log('[TEST 3 - 401 Unauthenticated Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: Permission Denial (SECURITY_OFFICER attempting returns:create)
      const res4 = await fetch('http://localhost:3022/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({
          storeId: 'store-1',
          lines: [{ itemId: 'item-1', quantityReturned: 2 }],
        }),
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 Permission Denial Rejection]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4
      if (allPassed) {
        console.log('--- ALL BE-117 RETURN REQUEST API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME RETURN REQUEST INTEGRATION TESTS FAILED')
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
