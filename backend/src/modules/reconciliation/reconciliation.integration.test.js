/**
 * Reconciliation Approval REST API Integration Test Suite
 * Task: BE-146 (Implement Reconciliation Approval API)
 * SRS Traceability: Section 12 (Stock Taking & Reconciliation), SRS BR-19
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runReconciliationIntegrationTests() {
  console.log('--- RUNNING BE-146 RECONCILIATION APPROVAL API INTEGRATION TESTS ---')

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

  const server = app.listen(3034, async () => {
    try {
      // Test 1: PAO Reconciliation Session Approval Authorization Pass
      const res1 = await fetch('http://localhost:3034/api/reconciliations/rec-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          approved: true,
          notes: 'PAO variance investigation approved',
        }),
      })
      // Confirms request passes authorization (status is 404 or 200, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - PAO Reconciliation Approval Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Non-boolean approved parameter)
      const res2 = await fetch('http://localhost:3034/api/reconciliations/rec-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          approved: 'invalid_boolean',
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Non-Boolean Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthenticated Request Rejection
      const res3 = await fetch('http://localhost:3034/api/reconciliations/rec-non-existent/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      const pass3 = res3.status === 401
      console.log('[TEST 3 - 401 Unauthenticated Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: Permission Denial (SECURITY_OFFICER attempting reconciliation:approve)
      const res4 = await fetch('http://localhost:3034/api/reconciliations/rec-non-existent/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ approved: true }),
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 Permission Denial Rejection]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4
      if (allPassed) {
        console.log('--- ALL BE-146 RECONCILIATION APPROVAL API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME RECONCILIATION APPROVAL INTEGRATION TESTS FAILED')
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
