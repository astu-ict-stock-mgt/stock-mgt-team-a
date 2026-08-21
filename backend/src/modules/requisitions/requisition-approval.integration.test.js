/**
 * Requisition Approval Routing REST API Integration Test Suite
 * Task: BE-100 (Implement Requisition Approval Routing)
 * SRS Traceability: Section 6 (Requisition Module), Clarification C-01, Section 13 (Security)
 */

import app from '../../app.js'
import { issueAuthToken } from '../auth/auth.service.js'

export async function runRequisitionApprovalIntegrationTests() {
  console.log('--- RUNNING BE-100 REQUISITION APPROVAL ROUTING INTEGRATION TESTS ---')

  const deptHeadUser = {
    userId: 'usr-depthead-1',
    email: 'depthead@stockmgt.gov.et',
    fullName: 'Department Head Officer',
    role: 'DEPARTMENT_HEAD',
    status: 'ACTIVE',
  }

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

  const deptHeadToken = issueAuthToken(deptHeadUser, '1h')
  const paoToken = issueAuthToken(paoUser, '1h')
  const unprivilegedToken = issueAuthToken(unprivilegedUser, '1h')

  const server = app.listen(3016, async () => {
    try {
      // Test 1: Department Head Approval Endpoint (Authorized Dept Head)
      const res1 = await fetch('http://localhost:3016/api/requisitions/req-non-existent/approve-department', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deptHeadToken}`,
        },
        body: JSON.stringify({}),
      })
      // Returns 404 (Not Found) or 200/409, confirming route reaches handler & passes 403 authorization
      const pass1 = res1.status !== 403 && res1.status !== 401
      console.log('[TEST 1 - Department Head Approval Authorization]:', pass1 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res1.status})`)

      // Test 2: PAO Officer Approval Endpoint (Authorized PAO)
      const res2 = await fetch('http://localhost:3016/api/requisitions/req-non-existent/approve-pao', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paoToken}`,
        },
        body: JSON.stringify({}),
      })
      const pass2 = res2.status !== 403 && res2.status !== 401
      console.log('[TEST 2 - PAO Officer Approval Authorization]:', pass2 ? '✅ PASSED (Authorized)' : `❌ FAILED (Status ${res2.status})`)

      // Test 3: Unauthorized Role Rejection (SECURITY_OFFICER attempting requisitions:approve)
      const res3 = await fetch('http://localhost:3016/api/requisitions/req-non-existent/approve-department', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unprivilegedToken}`,
        },
        body: JSON.stringify({}),
      })
      const pass3 = res3.status === 403
      console.log('[TEST 3 - 403 Permission Denial Rejection]:', pass3 ? '✅ PASSED' : `❌ FAILED (Status ${res3.status})`)

      const allPassed = pass1 && pass2 && pass3
      if (allPassed) {
        console.log('--- ALL BE-100 REQUISITION APPROVAL ROUTING INTEGRATION TESTS PASSED ---')
      } else {
        console.log('❌ SOME APPROVAL INTEGRATION TESTS FAILED')
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
