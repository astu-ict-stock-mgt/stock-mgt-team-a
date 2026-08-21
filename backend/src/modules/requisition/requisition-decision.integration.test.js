/**
 * Requisition Approve/Reject API Integration Tests
 * Task: BE-101
 *
 * ASSUMPTION — NOT SUPPLIED: no test framework (Jest/Mocha/Supertest) was
 * visible anywhere in what was shared for this project; every test file
 * supplied so far (BE-032's rbac.middleware.test.js, BE-096's
 * requisition.schema.test.js) is a plain async function using console.log
 * PASS/FAIL with no assertion library. This follows that same convention
 * and drives the real middleware chain (authorize -> validateRequest ->
 * controller) against mock req/res objects, rather than a real HTTP
 * server via supertest.
 *
 * If the repo does use Jest/Supertest elsewhere, port these three
 * scenarios into that format instead — the scenarios themselves (success,
 * validation error, permission denial) are what BE-101 asks for.
 *
 * ASSUMPTION: Test 1's success assertion checks `res.body.data.status`,
 * i.e. assumes sendSuccess() wraps the payload as `{ data: ... }`
 * (a common envelope shape). sendSuccess()'s real implementation wasn't
 * supplied — adjust that one assertion if the actual envelope differs.
 */
import { authorize } from '../../middleware/rbac.middleware.js'
import { validateRequest } from '../../middleware/validate.middleware.js'
import { requisitionDecisionDto } from './dto/requisition-decision.dto.js'
import { decideRequisition } from './requisition.controller.js'
import { RequisitionApprovalService } from './requisition-approval.service.js'
import { PERMISSIONS } from '../../config/rbac.js'

function mockRes() {
  const res = {}
  res.statusCode = 200
  res.body = null
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (payload) => {
    res.body = payload
    return res
  }
  return res
}

async function runChain(middlewares, req, res) {
  let error = null
  for (const mw of middlewares) {
    let nextCalled = false
    await new Promise((resolve) => {
      mw(req, res, (err) => {
        if (err) error = err
        nextCalled = true
        resolve()
      })
    })
    if (error || !nextCalled) break
  }
  return error
}

export async function runRequisitionDecisionApiTests() {
  console.log('--- RUNNING BE-101 REQUISITION APPROVE/REJECT API INTEGRATION TESTS ---')

  // Test 1: Successful decision — authorized PAO, valid APPROVE payload,
  // full chain (authorize -> validateRequest -> controller) succeeds.
  {
    const originalDecide = RequisitionApprovalService.decide
    RequisitionApprovalService.decide = async () => ({
      id: 'req-uuid-1',
      status: 'PAO_APPROVED',
      paoApprovedAt: new Date(),
      paoApprovedBy: 'usr-pao-1',
    })

    const req = {
      user: { userId: 'usr-pao-1', role: 'PAO' },
      params: { id: 'req-uuid-1' },
      body: { decision: 'APPROVE' },
    }
    const res = mockRes()

    const chainError = await runChain(
      [authorize(PERMISSIONS.REQUISITIONS_APPROVE), validateRequest(requisitionDecisionDto)],
      req,
      res
    )
    let controllerError = null
    if (!chainError) {
      await decideRequisition(req, res, (err) => {
        controllerError = err
      })
    }

    const passed = !chainError && !controllerError && res.body?.data?.status === 'PAO_APPROVED'
    console.log('[TEST 1 - Successful Decision (200, status updated)]:', passed ? '✅ PASSED' : '❌ FAILED')

    RequisitionApprovalService.decide = originalDecide
  }

  // Test 2: Validation error — REJECT submitted without a reason should
  // be rejected by the DTO before reaching the service layer.
  {
    const req = {
      user: { userId: 'usr-pao-1', role: 'PAO' },
      params: { id: 'req-uuid-1' },
      body: { decision: 'REJECT' }, // missing required reason
    }
    const res = mockRes()

    const chainError = await runChain(
      [authorize(PERMISSIONS.REQUISITIONS_APPROVE), validateRequest(requisitionDecisionDto)],
      req,
      res
    )

    const passed = chainError && chainError.statusCode === 422 && chainError.code === 'VALIDATION_ERROR'
    console.log(
      '[TEST 2 - Validation Error (REJECT without reason -> 422)]:',
      passed ? '✅ PASSED' : '❌ FAILED'
    )
  }

  // Test 3: Permission denial — a REQUESTER-role user lacks
  // requisitions:approve entirely and is rejected at the RBAC gate before
  // validation or the service layer ever run.
  {
    const req = {
      user: { userId: 'usr-req-1', role: 'REQUESTER' },
      params: { id: 'req-uuid-1' },
      body: { decision: 'APPROVE' },
    }
    const res = mockRes()

    const chainError = await runChain([authorize(PERMISSIONS.REQUISITIONS_APPROVE)], req, res)

    const passed = chainError && chainError.statusCode === 403 && chainError.code === 'FORBIDDEN'
    console.log(
      '[TEST 3 - Permission Denial (REQUESTER lacks requisitions:approve -> 403)]:',
      passed ? '✅ PASSED' : '❌ FAILED'
    )
  }

  console.log('--- ALL BE-101 REQUISITION APPROVE/REJECT API INTEGRATION TESTS COMPLETE ---')
}
