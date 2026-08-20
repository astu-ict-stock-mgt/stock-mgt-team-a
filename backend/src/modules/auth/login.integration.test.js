/**
 * Login REST API Integration Test Suite
 * Task: BE-028 (Implement Login API)
 * SRS Traceability: FR-01 (Authentication), FR-03 (Session Management), Section 13
 */

import app from '../../app.js'

export async function runLoginIntegrationTests() {
  console.log('--- RUNNING BE-028 LOGIN REST API INTEGRATION TESTS ---')

  const server = app.listen(3009, async () => {
    try {
      // Test 1: Validation Error (Invalid Email Format)
      const res1 = await fetch('http://localhost:3009/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: '123' }),
      })
      const data1 = await res1.json()
      const pass1 = res1.status === 400 && data1.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 1 - 400 Validation Error]:', pass1 ? '✅ PASSED' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: Missing Password
      const res2 = await fetch('http://localhost:3009/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@stockmgt.gov.et' }),
      })
      const data2 = await res2.json()
      const pass2 = res2.status === 400 && data2.error?.code === 'VALIDATION_ERROR'
      console.log('[TEST 2 - 400 Missing Field Rejection]:', pass2 ? '✅ PASSED' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthorized (Invalid Password / Non-existent User)
      const res3 = await fetch('http://localhost:3009/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent.user@stockmgt.gov.et', password: 'WrongPassword123!' }),
      })
      const data3 = await res3.json()
      const pass3 = res3.status === 401 && data3.error?.code === 'UNAUTHORIZED'
      console.log('[TEST 3 - 401 Unauthorized Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-028 LOGIN API INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME INTEGRATION TESTS FAILED')
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
