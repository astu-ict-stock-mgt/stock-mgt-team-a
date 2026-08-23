/**
 * Return Approval & Disposition REST API Integration Test Suite
 * Task: BE-119 (Implement Return Approval/Disposition APIs)
 * SRS Traceability: Section 7 (Stock Return & Disposition), Section 13 (Security), Clarification C-09
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runReturnApprovalIntegrationTests() {
  console.log('--- RUNNING BE-119 RETURN APPROVAL & DISPOSITION API INTEGRATION TESTS ---')

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

  const server = app.listen(3024, async () => {
    try {
      // Test 1: Return Approval Endpoint Authorization Pass (PAO role with RESTOCK disposition)
      const res1 = await fetch('http://localhost:3024/api/returns/ret-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          disposition: 'RESTOCK',
          remarks: 'Approved for active stock restock',
        }),
      })
      // Confirms request passes authorization (status is 404 or 200, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - PAO Disposition Approval Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Invalid disposition string)
      const res2 = await fetch('http://localhost:3024/api/returns/ret-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          disposition: 'INVALID_DISPOSITION',
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Invalid Disposition Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthenticated Request Rejection
      const res3 = await fetch('http://localhost:3024/api/returns/ret-non-existent/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disposition: 'RESTOCK' }),
      })
      const pass3 = res3.status === 401
      console.log('[TEST 3 - 401 Unauthenticated Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: Permission Denial (SECURITY_OFFICER attempting returns:approve)
      const res4 = await fetch('http://localhost:3024/api/returns/ret-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ disposition: 'RESTOCK' }),
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 Permission Denial Rejection]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4
      if (allPassed) {
        console.log('--- ALL BE-119 RETURN APPROVAL & DISPOSITION API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME RETURN APPROVAL INTEGRATION TESTS FAILED')
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
