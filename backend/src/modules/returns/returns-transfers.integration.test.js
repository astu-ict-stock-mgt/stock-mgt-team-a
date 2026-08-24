/**
 * Return & Transfer Combined Integration Test Suite
 * Task: BE-128 (Return/Transfer Integration Tests)
 * SRS Traceability: Section 7 (Stock Return), Section 8 (Stock Transfer), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runReturnsTransfersIntegrationTests() {
  console.log('--- RUNNING BE-128 RETURN & TRANSFER INTEGRATION TESTS ---')

  const requesterUser = {
    userId: 'usr-requester-1',
    email: 'requester@stockmgt.gov.et',
    fullName: 'Department Requester',
    role: 'REQUESTER',
    status: 'ACTIVE',
  }

  const storekeeperUser = {
    userId: 'usr-storekeeper-1',
    email: 'storekeeper@stockmgt.gov.et',
    fullName: 'Storekeeper Officer',
    role: 'STOREKEEPER',
    status: 'ACTIVE',
  }

  const paoUser = {
    userId: 'usr-pao-1',
    email: 'pao@stockmgt.gov.et',
    fullName: 'Property Administration Officer',
    role: 'PAO',
    status: 'ACTIVE',
  }

  const tecUser = {
    userId: 'usr-tec-1',
    email: 'tec@stockmgt.gov.et',
    fullName: 'Technical Evaluation Committee',
    role: 'TEC',
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
  const storekeeperToken = issueAuthToken(storekeeperUser, '1h')
  const paoToken = issueAuthToken(paoUser, '1h')
  const tecToken = issueAuthToken(tecUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3027, async () => {
    try {
      // Test 1: Stock Return Creation & Workflow Authorization
      const res1 = await fetch('http://localhost:3027/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${requesterToken}`,
        },
        body: JSON.stringify({
          storeId: 'store-1',
          reason: 'UNUSED',
          lines: [{ itemId: 'item-1', quantityReturned: 3 }],
        }),
      })
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Stock Return Creation Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Stock Transfer Creation & Workflow Authorization
      const res2 = await fetch('http://localhost:3027/api/transfers', {
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
      const pass2 = res2.status !== 403 && res2.status !== 401
      console.log('[TEST 2 - Stock Transfer Creation Authorization Pass]:', pass2 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: 400 Bad Request Validation Error (Empty lines array)
      const res3 = await fetch('http://localhost:3027/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          sourceStoreId: 'store-1',
          destinationStoreId: 'store-2',
          lines: [],
        }),
      })
      const data3 = await res3.json()
      const pass3 = res3.status === 400 && data3.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 3 - 400 Validation Error Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: 403 Permission Denial (SECURITY_OFFICER role)
      const res4 = await fetch('http://localhost:3027/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({
          storeId: 'store-1',
          lines: [{ itemId: 'item-1', quantityReturned: 1 }],
        }),
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 Permission Denial Rejection]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      // Test 5: 401 Unauthenticated Rejection
      const res5 = await fetch('http://localhost:3027/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceStoreId: 'store-1',
          destinationStoreId: 'store-2',
          lines: [{ itemId: 'item-1', quantityRequested: 1 }],
        }),
      })
      const pass5 = res5.status === 401
      console.log('[TEST 5 - 401 Unauthenticated Rejection]:', pass5 ? '✅ PASSED' : `❌ FAILED (Status ${res5.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4 && pass5
      if (allPassed) {
        console.log('--- ALL BE-128 RETURN & TRANSFER INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME RETURN/TRANSFER INTEGRATION TESTS FAILED')
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
