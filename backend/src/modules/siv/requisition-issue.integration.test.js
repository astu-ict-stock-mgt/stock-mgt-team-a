/**
 * Requisition & Store Issue Voucher (SIV/ISIV) Comprehensive REST API Integration Test Suite
 * Task: BE-113 (Requisition/Issue Integration Tests)
 * SRS Traceability: Section 5 (Requisition Module), Section 6 (Store Issue Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runRequisitionIssueIntegrationTests() {
  console.log('--- RUNNING BE-113 REQUISITION / ISSUE COMPREHENSIVE INTEGRATION TESTS ---')

  const requesterUser = {
    userId: 'usr-requester-1',
    email: 'requester@stockmgt.gov.et',
    fullName: 'Department Requester',
    role: 'REQUESTER',
    status: 'ACTIVE',
  }

  const deptHeadUser = {
    userId: 'usr-depthead-1',
    email: 'depthead@stockmgt.gov.et',
    fullName: 'Department Head',
    role: 'DEPARTMENT_HEAD',
    status: 'ACTIVE',
  }

  const paoUser = {
    userId: 'usr-pao-1',
    email: 'pao@stockmgt.gov.et',
    fullName: 'Property Administration Officer',
    role: 'PAO',
    status: 'ACTIVE',
  }

  const storekeeperUser = {
    userId: 'usr-storekeeper-1',
    email: 'storekeeper@stockmgt.gov.et',
    fullName: 'Central Storekeeper',
    role: 'STOREKEEPER',
    status: 'ACTIVE',
  }

  const requesterToken = issueAuthToken(requesterUser, '1h')
  const deptHeadToken = issueAuthToken(deptHeadUser, '1h')
  const paoToken = issueAuthToken(paoUser, '1h')
  const storekeeperToken = issueAuthToken(storekeeperUser, '1h')

  const server = app.listen(3021, async () => {
    try {
      // Test 1: Requisition Creation Authorization Pass (Requester role)
      const res1 = await fetch('http://localhost:3021/api/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${requesterToken}`,
        },
        body: JSON.stringify({
          purpose: 'End-to-End Integration Test Requisition',
          items: [{ itemId: 'item-1', requestedQuantity: 5 }],
        }),
      })
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Requisition Creation Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Empty items array on Requisition Creation)
      const res2 = await fetch('http://localhost:3021/api/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${requesterToken}`,
        },
        body: JSON.stringify({
          purpose: 'Invalid Empty Requisition',
          items: [],
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Empty Items Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (Requester attempting SIV Creation - storekeeper required)
      const res3 = await fetch('http://localhost:3021/api/sivs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${requesterToken}`,
        },
        body: JSON.stringify({
          requisitionId: 'req-1',
          storeId: 'store-1',
          issuedToUserId: 'usr-requester-1',
          lines: [{ itemId: 'item-1', quantityIssued: 5 }],
        }),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 SIV Creation Permission Denial]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: Permission Denial (Storekeeper attempting Requisition PAO Approval - PAO required)
      const res4 = await fetch('http://localhost:3021/api/requisitions/req-non-existent/approve-pao', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 PAO Approval Permission Denial]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      // Test 5: Authorized SIV Creation & Finalize Workflow Route Verification
      const res5 = await fetch('http://localhost:3021/api/sivs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          requisitionId: 'req-non-existent',
          storeId: 'store-1',
          issuedToUserId: 'usr-requester-1',
          lines: [{ itemId: 'item-1', quantityIssued: 5 }],
        }),
      })
      const pass5 = res5.status !== 403 && res5.status !== 401
      console.log('[TEST 5 - Storekeeper SIV Creation Route Authorization]:', pass5 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res5.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4 && pass5
      if (allPassed) {
        console.log('--- ALL BE-113 REQUISITION / ISSUE INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME REQUISITION / ISSUE INTEGRATION TESTS FAILED')
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
