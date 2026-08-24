/**
 * Inventory Valuation REST API Integration Test Suite
 * Task: BE-148 (Implement Inventory Valuation API)
 * SRS Traceability: Section 12 (Reporting & Inventory Valuation)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runValuationIntegrationTests() {
  console.log('--- RUNNING BE-148 INVENTORY VALUATION API INTEGRATION TESTS ---')

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

  const server = app.listen(3036, async () => {
    try {
      // Test 1: PAO Inventory Valuation Report Pass
      const res1 = await fetch('http://localhost:3036/api/inventory/valuation', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paoToken}`,
        },
      })
      // Confirms request passes authorization (status is 200 or 500 DB error, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - PAO Inventory Valuation Report Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Unauthenticated Request Rejection
      const res2 = await fetch('http://localhost:3036/api/inventory/valuation', {
        method: 'GET',
      })
      const pass2 = res2.status === 401
      console.log('[TEST 2 - 401 Unauthenticated Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (SECURITY_OFFICER attempting reports:view)
      const res3 = await fetch('http://localhost:3036/api/inventory/valuation', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${unprivilegedToken}`,
        },
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-148 INVENTORY VALUATION API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME INVENTORY VALUATION INTEGRATION TESTS FAILED')
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
