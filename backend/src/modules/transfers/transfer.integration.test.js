/**
 * Stock Transfer Request (STR) REST API Integration Test Suite
 * Task: BE-124 (Implement Transfer Request APIs)
 * SRS Traceability: Section 8 (Stock Transfer Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runTransferIntegrationTests() {
  console.log('--- RUNNING BE-124 TRANSFER REQUEST API INTEGRATION TESTS ---')

  const storekeeperUser = {
    userId: 'usr-storekeeper-1',
    email: 'storekeeper@stockmgt.gov.et',
    fullName: 'Storekeeper Officer',
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

  const storekeeperToken = issueAuthToken(storekeeperUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3025, async () => {
    try {
      // Test 1: Transfer Request Authorization Pass (Storekeeper role)
      const res1 = await fetch('http://localhost:3025/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          transferType: 'STORE_TO_STORE',
          sourceStoreId: 'store-1',
          destinationStoreId: 'store-2',
          lines: [{ itemId: 'item-1', quantityRequested: 5 }],
        }),
      })
      // Confirms request passes authorization (status is 404/201, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Transfer Creation Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Empty lines array)
      const res2 = await fetch('http://localhost:3025/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          transferType: 'STORE_TO_STORE',
          sourceStoreId: 'store-1',
          destinationStoreId: 'store-2',
          lines: [],
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Empty Lines Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthenticated Request Rejection
      const res3 = await fetch('http://localhost:3025/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceStoreId: 'store-1',
          destinationStoreId: 'store-2',
          lines: [{ itemId: 'item-1', quantityRequested: 5 }],
        }),
      })
      const pass3 = res3.status === 401
      console.log('[TEST 3 - 401 Unauthenticated Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: Permission Denial (SECURITY_OFFICER attempting transfers:create)
      const res4 = await fetch('http://localhost:3025/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({
          sourceStoreId: 'store-1',
          destinationStoreId: 'store-2',
          lines: [{ itemId: 'item-1', quantityRequested: 5 }],
        }),
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 Permission Denial Rejection]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4
      if (allPassed) {
        console.log('--- ALL BE-124 TRANSFER REQUEST API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME TRANSFER REQUEST INTEGRATION TESTS FAILED')
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
