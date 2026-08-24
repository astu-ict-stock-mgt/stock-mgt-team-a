/**
 * Shelf-Life Service & Calculation Engine Unit Test Suite
 * Task: BE-134 (Implement Expiry/Status Rules)
 * SRS Traceability: Section 10 (Shelf-Life & Expiry Module), Clarification Register C-12
 */

import { computeShelfLifeStatus } from './shelflife.service.js'

export async function runShelfLifeServiceTests() {
  console.log('--- RUNNING BE-134 SHELF-LIFE SERVICE & CALCULATION ENGINE UNIT TESTS ---')

  const now = new Date()

  // Test 1: HEALTHY Status Calculation (> 30 days remaining)
  const healthyDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const status1 = computeShelfLifeStatus(healthyDate, 30, now)
  const pass1 = status1 === 'HEALTHY'
  console.log('[TEST 1 - HEALTHY Status Rule (> 30 days)]: ', pass1 ? '✅ PASSED' : `❌ FAILED (Got ${status1})`)

  // Test 2: NEAR_EXPIRY Status Calculation (<= 30 days remaining)
  const nearExpiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
  const status2 = computeShelfLifeStatus(nearExpiryDate, 30, now)
  const pass2 = status2 === 'NEAR_EXPIRY'
  console.log('[TEST 2 - NEAR_EXPIRY Status Rule (<= 30 days)]: ', pass2 ? '✅ PASSED' : `❌ FAILED (Got ${status2})`)

  // Test 3: EXPIRED Status Calculation (0 or negative days remaining)
  const expiredDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const status3 = computeShelfLifeStatus(expiredDate, 30, now)
  const pass3 = status3 === 'EXPIRED'
  console.log('[TEST 3 - EXPIRED Status Rule (<= 0 days)]: ', pass3 ? '✅ PASSED' : `❌ FAILED (Got ${status3})`)

  // Test 4: Custom Alert Threshold (60 days threshold)
  const customAlertDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)
  const status4 = computeShelfLifeStatus(customAlertDate, 60, now)
  const pass4 = status4 === 'NEAR_EXPIRY'
  console.log('[TEST 4 - Custom Alert Threshold Guard (60 days)]: ', pass4 ? '✅ PASSED' : `❌ FAILED (Got ${status4})`)

  const allPassed = pass1 && pass2 && pass3 && pass4
  if (allPassed) {
    console.log('--- ALL BE-134 SHELF-LIFE SERVICE UNIT TESTS PASSED ---')
  } else {
    console.log('❌ SOME SHELF-LIFE SERVICE UNIT TESTS FAILED')
  }
}
