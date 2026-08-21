/**
 * Preliminary SIV REST API Integration Test Suite
 * Task: BE-106 (Implement Preliminary SIV/ISIV API)
 * SRS Traceability: Section 6 (Store Issue Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runSivIntegrationTests() {
  console.log('--- RUNNING BE-106 PRELIMINARY SIV API INTEGRATION TESTS ---')

  const storekeeperUser = {
    userId: 'usr-storekeeper-1',
    email: 'storekeeper@stockmgt.gov.et',
    fullName: 'Central Storekeeper',
    role: 'STOREKEEPER',
    status: 'ACTIVE',
  }

  const unprivilegedUser = {
    userId: 'usr-security-1',
    email: 'security@stockmgt.gov.et',
    fullName: 'Security Officer',
    role: 'SECURITY_OFFICER',
    status: 'ACTIVE',
  }

  const validToken = issueAuthToken(storekeeperUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3017, async () => {
    try {
      // Test 1: Validation Error (Missing Requisition ID & Negative Quantity)
      const res1 = await fetch('http://localhost:3017/api/sivs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          storeId: 'store-1',
          issuedToUserId: 'user-1',
          lines: [{ itemId: 'item-1', quantityIssued: -5 }],
        }),
      })
      const data1 = await res1.json()
      const pass1 = res1.status === 400 && data1.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 1 - 400 Validation Rejection]:', pass1 ? '✅ PASSED' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Unauthenticated Request Rejection
      const res2 = await fetch('http://localhost:3017/api/sivs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requisitionId: 'req-1',
          storeId: 'store-1',
          issuedToUserId: 'user-1',
          lines: [{ itemId: 'item-1', quantityIssued: 2 }],
        }),
      })
      const pass2 = res2.status === 401
      console.log('[TEST 2 - 401 Unauthenticated Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (SECURITY_OFFICER attempting issues:create)
      const res3 = await fetch('http://localhost:3017/api/sivs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({
          requisitionId: 'req-1',
          storeId: 'store-1',
          issuedToUserId: 'user-1',
          lines: [{ itemId: 'item-1', quantityIssued: 2 }],
        }),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-106 PRELIMINARY SIV API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME SIV INTEGRATION TESTS FAILED')
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
