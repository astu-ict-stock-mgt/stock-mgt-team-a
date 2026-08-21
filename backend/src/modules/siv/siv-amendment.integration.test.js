/**
 * SIV Amendment REST API Integration Test Suite
 * Task: BE-107 (Implement SIV/ISIV Amendment API)
 * SRS Traceability: Section 6 (Store Issue Module), Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runSivAmendmentIntegrationTests() {
  console.log('--- RUNNING BE-107 SIV AMENDMENT API INTEGRATION TESTS ---')

  const storekeeperUser = {
    userId: 'usr-storekeeper-1',
    email: 'storekeeper@stockmgt.gov.et',
    fullName: 'Central Storekeeper',
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

  const server = app.listen(3018, async () => {
    try {
      // Test 1: SIV Amendment Endpoint Authorization (Storekeeper role)
      const res1 = await fetch('http://localhost:3018/api/sivs/siv-non-existent/amend', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          notes: 'Amended delivery instructions',
        }),
      })
      // Confirms request passes authorization (status is 404 or 200, but not 403 or 401)
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - SIV Amendment Authorization Pass]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Validation Error (Negative Line Quantity Amendment)
      const res2 = await fetch('http://localhost:3018/api/sivs/siv-non-existent/amend', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storekeeperToken}`,
        },
        body: JSON.stringify({
          lineAmendments: [{ lineId: 'line-1', quantityIssued: -2 }],
        }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Negative Quantity Validation Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Permission Denial (SECURITY_OFFICER attempting siv:amend)
      const res3 = await fetch('http://localhost:3018/api/sivs/siv-non-existent/amend', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({ notes: 'Unauthorized edit' }),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-107 SIV AMENDMENT API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME SIV AMENDMENT INTEGRATION TESTS FAILED')
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
