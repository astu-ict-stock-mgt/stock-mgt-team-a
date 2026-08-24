/**
 * Disposal Evidence/Completion REST API Integration Test Suite
 * Task: BE-140 (Implement Disposal Evidence/Completion API)
 * SRS Traceability: Section 11 (Disposal Module), Section 13 (Security), SRS BR-18
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runDisposalCompletionIntegrationTests() {
  console.log('--- RUNNING BE-140 DISPOSAL COMPLETION API INTEGRATION TESTS ---')

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

  const server = app.listen(3032, async () => {
    try {
      // Test 1: PAO Disposal Request Completion Authorization Pass
      const res1 = await fetch('http://localhost:3032/api/disposals/dsp-non-existent/complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          evidenceDetails: 'Certificate of Destruction Ref #COD-2026-99',
          notes: 'Public destruction performed at city recycling center',
        }),
      })
      // Confirms request passes authorization (status is 404 or 200, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - PAO Disposal Completion Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Missing evidenceDetails)
      const res2 = await fetch('http://localhost:3032/api/disposals/dsp-non-existent/complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          evidenceDetails: '',
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Empty Evidence Details Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthenticated Request Rejection
      const res3 = await fetch('http://localhost:3032/api/disposals/dsp-non-existent/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceDetails: 'Valid Certificate' }),
      })
      const pass3 = res3.status === 401
      console.log('[TEST 3 - 401 Unauthenticated Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: Permission Denial (SECURITY_OFFICER attempting disposal:execute)
      const res4 = await fetch('http://localhost:3032/api/disposals/dsp-non-existent/complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ evidenceDetails: 'Valid Certificate' }),
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 Permission Denial Rejection]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4
      if (allPassed) {
        console.log('--- ALL BE-140 DISPOSAL COMPLETION API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME DISPOSAL COMPLETION INTEGRATION TESTS FAILED')
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
