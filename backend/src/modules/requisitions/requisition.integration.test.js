/**
 * Requisition Create REST API Integration Test Suite
 * Task: BE-099 (Implement Requisition Create API)
 * SRS Traceability: Section 6 (Requisition Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runRequisitionIntegrationTests() {
  console.log('--- RUNNING BE-099 REQUISITION CREATE API INTEGRATION TESTS ---')

  const authorizedUser = {
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

  const validToken = issueAuthToken(authorizedUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3015, async () => {
    try {
      // Test 1: Validation Error (Missing Department ID & Negative Quantity)
      const res1 = await fetch('http://localhost:3015/api/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          storeId: 'store-1',
          purpose: 'Hardware renewal',
          lines: [{ itemId: 'item-1', requestedQuantity: -1 }],
        }),
      })
      const data1 = await res1.json()
      const pass1 = res1.status === 400 && data1.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 1 - 400 Validation Rejection]:', pass1 ? '✅ PASSED' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Unauthenticated Request Rejection
      const res2 = await fetch('http://localhost:3015/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: 'dept-1',
          storeId: 'store-1',
          purpose: 'Hardware renewal',
          lines: [{ itemId: 'item-1', requestedQuantity: 5 }],
        }),
      })
      const pass2 = res2.status === 401
      console.log('[TEST 2 - 401 Unauthenticated Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (SECURITY_OFFICER attempting requisitions:create)
      const res3 = await fetch('http://localhost:3015/api/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({
          departmentId: 'dept-1',
          storeId: 'store-1',
          purpose: 'Hardware renewal',
          lines: [{ itemId: 'item-1', requestedQuantity: 5 }],
        }),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-099 REQUISITION CREATE API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME INTEGRATION TESTS FAILED')
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
