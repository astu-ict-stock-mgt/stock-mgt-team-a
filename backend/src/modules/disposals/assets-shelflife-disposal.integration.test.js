/**
 * Batch 8 Master Integration Test Suite (Assets, Shelf-Life & Disposal)
 * Task: BE-141 (Asset/Shelf-Life/Disposal Integration Tests)
 * SRS Traceability: Section 9 (Fixed Assets), Section 10 (Shelf-Life), Section 11 (Disposal), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runAssetsShelflifeDisposalIntegrationTests() {
  console.log('--- RUNNING BE-141 ASSETS, SHELF-LIFE & DISPOSAL MASTER INTEGRATION TESTS ---')

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

  const paoToken = issueAuthToken(paoUser, '1h')
  const storekeeperToken = issueAuthToken(storekeeperUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3033, async () => {
    try {
      // Test 1: Fixed Asset Registration & Custody Assignment Authorization
      const res1 = await fetch('http://localhost:3033/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({
          name: 'Dell Server Rack 42U',
          category: 'IT Infrastructure',
          purchaseCost: 4500.0,
        }),
      })
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Fixed Asset Registration Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Shelf-Life Batch Registration & Evaluation Authorization
      const res2 = await fetch('http://localhost:3033/api/shelflife/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
      })
      const pass2 = res2.status !== 403 && res2.status !== 401
      console.log('[TEST 2 - Shelf-Life Status Evaluation Authorization Pass]:', pass2 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Disposal Candidate Detection Scan Authorization
      const res3 = await fetch('http://localhost:3033/api/shelflife/disposal-candidates', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storekeeperToken}`,
        },
      })
      const pass3 = res3.status !== 403 && res3.status !== 401
      console.log('[TEST 3 - Disposal Candidate Detection Authorization Pass]:', pass3 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res3.status})`)

      // Test 4: End-to-End Disposal Request Creation Authorization Pass
      const res4 = await fetch('http://localhost:3033/api/disposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          disposalMethod: 'AUCTION',
          reason: 'Surplus hardware equipment for public auction',
        }),
      })
      const pass4 = res4.status !== 403 && res4.status !== 401
      console.log('[TEST 4 - Disposal Request Creation Authorization Pass]:', pass4 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res4.status})`)

      // Test 5: 400 Bad Request Validation Error Rejection (Empty Asset Name)
      const res5 = await fetch('http://localhost:3033/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({ name: '' }),
      })
      const data5 = await res5.json()
      const pass5 = res5.status === 400 && data5.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 5 - 400 Validation Error Rejection]:', pass5 ? '✅ PASSED' : `❌ FAILED (Status ${res5.status})`)

      // Test 6: 403 Forbidden Permission Denial (Security Officer attempting disposal)
      const res6 = await fetch('http://localhost:3033/api/disposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ disposalMethod: 'AUCTION' }),
      })
      const pass6 = res6.status === 403
      console.log('[TEST 6 - 403 Permission Denial Rejection]:', pass6 ? '✅ PASSED' : `❌ FAILED (Status ${res6.status})`)

      // Test 7: 401 Unauthenticated Request Rejection
      const res7 = await fetch('http://localhost:3033/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthenticated Server' }),
      })
      const pass7 = res7.status === 401
      console.log('[TEST 7 - 401 Unauthenticated Rejection]:', pass7 ? '✅ PASSED' : `❌ FAILED (Status ${res7.status})`)

      const allPassed = pass1 && pass2 && pass3 && pass4 && pass5 && pass6 && pass7
      if (allPassed) {
        console.log('--- ALL BE-141 ASSETS, SHELF-LIFE & DISPOSAL MASTER INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME BATCH 8 MASTER INTEGRATION TESTS FAILED')
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
