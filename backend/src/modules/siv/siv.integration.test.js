/**
 * SIV REST API Integration Test Suite
 * Tasks: BE-106 (Preliminary SIV), BE-107 (Amendment), BE-108 (Approval),
 *        BE-109 (Finalization), BE-111 (Gate/Dispatch Verification)
 * SRS Traceability: Section 6 (Store Issue Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runSivIntegrationTests() {
  console.log('--- RUNNING SIV API INTEGRATION TESTS (BE-106–BE-111) ---')

  const storekeeperUser = {
    userId: 'usr-storekeeper-1',
    email: 'storekeeper@stockmgt.gov.et',
    fullName: 'Central Storekeeper',
    role: 'STOREKEEPER',
    status: 'ACTIVE',
  }

  const paoUser = {
    userId: 'usr-pao-1',
    email: 'pao@stockmgt.gov.et',
    fullName: 'Property Admin Officer',
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

  const validToken = issueAuthToken(storekeeperUser, '1h')
  const paoToken = issueAuthToken(paoUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  let allPassed = true

  const assert = (testName, condition) => {
    if (!condition) allPassed = false
    console.log(`[${testName}]: ${condition ? '✅ PASSED' : '❌ FAILED'}`)
    return condition
  }

  const server = app.listen(3018, async () => {
    try {
      // === BE-106: Preliminary SIV API ===

      // Test 1: Validation Error (Negative Quantity)
      const res1 = await fetch('http://localhost:3018/api/sivs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({
          storeId: 'store-1',
          issuedToUserId: 'user-1',
          lines: [{ itemId: 'item-1', quantityIssued: -5 }],
        }),
      })
      const data1 = await res1.json()
      assert('BE-106: 400 Validation Rejection', res1.status === 400 && data1.error?.code === 'VALIDATION_ERROR')

      // Test 2: Unauthenticated Request Rejection
      const res2 = await fetch('http://localhost:3018/api/sivs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requisitionId: 'req-1',
          storeId: 'store-1',
          issuedToUserId: 'user-1',
          lines: [{ itemId: 'item-1', quantityIssued: 2 }],
        }),
      })
      assert('BE-106: 401 Unauthenticated Rejection', res2.status === 401)

      // Test 3: Permission Denial (SECURITY_OFFICER attempting issues:create)
      const res3 = await fetch('http://localhost:3018/api/sivs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${unprivilegedToken}` },
        body: JSON.stringify({
          requisitionId: 'req-1',
          storeId: 'store-1',
          issuedToUserId: 'user-1',
          lines: [{ itemId: 'item-1', quantityIssued: 2 }],
        }),
      })
      assert('BE-106: 403 Permission Denial', res3.status === 403)

      // Test 4: Successful SIV Creation
      const res4 = await fetch('http://localhost:3018/api/sivs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({
          requisitionId: 'req-1',
          storeId: 'store-1',
          issuedToUserId: 'user-1',
          lines: [{ itemId: 'item-1', quantityIssued: 2 }],
        }),
      })
      const data4 = await res4.json()
      const sivId = data4.data?.id
      assert('BE-106: 201 SIV Created', res4.status === 201 && sivId)

      // === BE-107: SIV Amendment API ===

      // Test 5: Amendment Validation Error (Empty lines)
      if (sivId) {
        const res5 = await fetch(`http://localhost:3018/api/sivs/${sivId}/amend`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
          body: JSON.stringify({ lines: [] }),
        })
        assert('BE-107: 400 Amendment Validation', res5.status === 400)

        // Test 6: Successful Amendment
        const res6 = await fetch(`http://localhost:3018/api/sivs/${sivId}/amend`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
          body: JSON.stringify({ lines: [{ itemId: 'item-1', quantityIssued: 3 }] }),
        })
        assert('BE-107: 200 Amendment Success', res6.status === 200)
      }

      // === BE-108: SIV Approval API ===

      // Test 7: Approval Permission Denial
      if (sivId) {
        const res7 = await fetch(`http://localhost:3018/api/sivs/${sivId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${unprivilegedToken}` },
          body: JSON.stringify({ decision: 'APPROVED' }),
        })
        assert('BE-108: 403 Approval Permission Denial', res7.status === 403)

        // Test 8: Successful Approval
        const res8 = await fetch(`http://localhost:3018/api/sivs/${sivId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${paoToken}` },
          body: JSON.stringify({ decision: 'APPROVED' }),
        })
        assert('BE-108: 200 Approval Success', res8.status === 200)
      }

      // === BE-109: SIV Finalization API ===

      // Test 9: Finalization Permission Denial
      if (sivId) {
        const res9 = await fetch(`http://localhost:3018/api/sivs/${sivId}/finalize`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${unprivilegedToken}` },
        })
        assert('BE-109: 403 Finalization Permission Denial', res9.status === 403)

        // Test 10: Successful Finalization
        const res10 = await fetch(`http://localhost:3018/api/sivs/${sivId}/finalize`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
        })
        assert('BE-109: 200 Finalization Success', res10.status === 200)
      }

      // === BE-111: Gate/Dispatch Verification API ===

      // Test 11: Gate Verification Permission Denial
      if (sivId) {
        const res11 = await fetch(`http://localhost:3018/api/sivs/${sivId}/gate-verify`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${unprivilegedToken}` },
          body: JSON.stringify({ verified: true }),
        })
        assert('BE-111: 403 Gate Verification Permission Denial', res11.status === 403)

        // Test 12: Successful Gate Verification
        const res12 = await fetch(`http://localhost:3018/api/sivs/${sivId}/gate-verify`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
          body: JSON.stringify({ verified: true }),
        })
        assert('BE-111: 200 Gate Verification Success', res12.status === 200)
      }

      // Test 13: List SIVs
      const res13 = await fetch('http://localhost:3018/api/sivs', {
        method: 'GET',
        headers: { Authorization: `Bearer ${validToken}` },
      })
      assert('BE-106: 200 List SIVs', res13.status === 200)

      // Test 14: Get SIV by ID
      if (sivId) {
        const res14 = await fetch(`http://localhost:3018/api/sivs/${sivId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${validToken}` },
        })
        assert('BE-106: 200 Get SIV by ID', res14.status === 200)
      }

      if (allPassed) {
        console.log('--- ALL SIV API INTEGRATION TESTS PASSED (BE-106–BE-111) ---')
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
