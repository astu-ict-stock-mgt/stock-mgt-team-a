/**
 * Disposal Request REST API Integration Test Suite
 * Task: BE-137 (Implement Disposal Request API)
 * SRS Traceability: Section 11 (Disposal Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runDisposalIntegrationTests() {
  console.log('--- RUNNING BE-137 DISPOSAL API INTEGRATION TESTS ---')

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

  const server = app.listen(3030, async () => {
    try {
      // Test 1: Disposal Request Creation Authorization Pass (STOREKEEPER role)
      const res1 = await fetch('http://localhost:3030/api/disposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          disposalMethod: 'DESTRUCTION',
          reason: 'Damaged obsolete hardware items',
        }),
      })
      // Confirms request passes authorization (status is 404 or 201, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Disposal Request Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Invalid disposal method)
      const res2 = await fetch('http://localhost:3030/api/disposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          disposalMethod: 'INVALID_METHOD',
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Invalid Method Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthenticated Request Rejection
      const res3 = await fetch('http://localhost:3030/api/disposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disposalMethod: 'AUCTION' }),
      })
      const pass3 = res3.status === 401
      console.log('[TEST 3 - 401 Unauthenticated Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: Permission Denial (SECURITY_OFFICER attempting disposals:create)
      const res4 = await fetch('http://localhost:3030/api/disposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ disposalMethod: 'AUCTION' }),
      })
      const pass4 = res4.status === 403
      console.log('[TEST 4 - 403 Permission Denial Rejection]:', pass4 ? '✅ PASSED' : `❌ FAILED (Status ${res4.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4
      if (allPassed) {
        console.log('--- ALL BE-137 DISPOSAL API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME DISPOSAL INTEGRATION TESTS FAILED')
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
