/**
 * Return Evaluation REST API Integration Test Suite
 * Task: BE-118 (Implement Return Evaluation APIs)
 * SRS Traceability: Section 7 (Stock Return Evaluation), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runReturnEvaluationIntegrationTests() {
  console.log('--- RUNNING BE-118 RETURN EVALUATION API INTEGRATION TESTS ---')

  const evaluatorUser = {
    userId: 'usr-evaluator-1',
    email: 'evaluator@stockmgt.gov.et',
    fullName: 'Technical Evaluator',
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

  const evaluatorToken = issueAuthToken(evaluatorUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3023, async () => {
    try {
      // Test 1: Return Evaluation Endpoint Authorization Pass (TECHNICAL_EVALUATOR role)
      const res1 = await fetch('http://localhost:3023/api/returns/ret-non-existent/evaluate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${evaluatorToken}`,
        },
        body: JSON.stringify({
          remarks: 'Technical inspection completed: Item in good working condition',
        }),
      })
      // Confirms request passes authorization (status is 404 or 200, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Technical Evaluator Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Unauthenticated Request Rejection
      const res2 = await fetch('http://localhost:3023/api/returns/ret-non-existent/evaluate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: 'Unauthenticated edit' }),
      })
      const pass2 = res2.status === 401
      console.log('[TEST 2 - 401 Unauthenticated Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (SECURITY_OFFICER attempting returns:evaluate)
      const res3 = await fetch('http://localhost:3023/api/returns/ret-non-existent/evaluate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ remarks: 'Unauthorized edit' }),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-118 RETURN EVALUATION API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME RETURN EVALUATION INTEGRATION TESTS FAILED')
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
