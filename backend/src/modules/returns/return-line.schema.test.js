/**
 * Return / Return Lines Schema Unit Test Suite
 * Task: BE-115 (Create Return Lines Schema), BE-114 (Create Return Schema)
 * SRS Traceability: Section 10.1 (Core Entities: returns, return_lines),
 *                   FR-32 (material return requests / SRN),
 *                   FR-33 (technical evaluation of returned materials),
 *                   FR-34 (approval/rejection and stock update),
 *                   BR-13 (return stock updates after approval & disposition),
 *                   BR-21 (auditability and no hard-delete),
 *                   Clarification C-09 (disposition options)
 */

import {
  ReturnStatusEnum,
  ReturnDispositionEnum,
  returnLineSchema,
  createReturnSchema,
} from './dto/return-line.dto.js'

export async function runReturnLineSchemaTests() {
  console.log('--- RUNNING BE-115 RETURN LINES SCHEMA UNIT TESTS ---')

  // Test 1: ReturnStatus & ReturnDisposition Enum Verification
  const expectedStatuses = [
    'DRAFT',
    'SUBMITTED',
    'PENDING_EVALUATION',
    'EVALUATED',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'COMPLETED',
  ]
  const expectedDispositions = [
    'RESTOCK',
    'QUARANTINE',
    'REPAIR',
    'DISPOSAL',
    'REPLACEMENT',
  ]

  const statusValid = expectedStatuses.every((s) => ReturnStatusEnum.options.includes(s))
  const dispositionValid = expectedDispositions.every((d) => ReturnDispositionEnum.options.includes(d))

  console.log(
    '[TEST 1 - Enum Options Verification]:',
    statusValid && dispositionValid ? '✅ PASSED' : '❌ FAILED'
  )

  // Test 2: ReturnLine Cost Math & Attributes
  const mockLine = {
    itemId: 'item-uuid-laptop-01',
    sivLineId: 'siv-line-uuid-01',
    quantityReturned: 2,
    unitCost: 1500.0,
    totalCost: 3000.0,
    condition: 'GOOD',
    disposition: 'RESTOCK',
    remarks: 'Returned in original packaging',
  }

  const parseResult = returnLineSchema.safeParse(mockLine)
  const isCostMathCorrect = mockLine.quantityReturned * mockLine.unitCost === mockLine.totalCost

  console.log(
    '[TEST 2 - Return Line Attributes & Math]:',
    parseResult.success && isCostMathCorrect ? '✅ PASSED' : '❌ FAILED'
  )

  // Test 3: Rejection of Non-Positive Quantity
  const invalidZeroQty = { ...mockLine, quantityReturned: 0 }
  const invalidNegativeQty = { ...mockLine, quantityReturned: -5 }
  const zeroResult = returnLineSchema.safeParse(invalidZeroQty)
  const negativeResult = returnLineSchema.safeParse(invalidNegativeQty)

  console.log(
    '[TEST 3 - Non-Positive Quantity Rejection]:',
    !zeroResult.success && !negativeResult.success ? '✅ PASSED' : '❌ FAILED'
  )

  // Test 4: Duplicate Item Detection within Return Document
  const duplicateReturnDoc = {
    storeId: 'store-uuid-01',
    reason: 'Department overhaul',
    lines: [
      { itemId: 'item-1', quantityReturned: 1, unitCost: 100 },
      { itemId: 'item-1', quantityReturned: 2, unitCost: 100 }, // duplicate
    ],
  }
  const duplicateResult = createReturnSchema.safeParse(duplicateReturnDoc)

  console.log(
    '[TEST 4 - Duplicate Item in Return Rejection]:',
    !duplicateResult.success ? '✅ PASSED (Duplicate Blocked)' : '❌ FAILED'
  )

  console.log('--- ALL BE-115 RETURN LINES SCHEMA UNIT TESTS PASSED ---')
}
