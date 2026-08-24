/**
 * Stock Management System (SMS) - Unit Tests: Return Lines Schema
 * Tasks: BE-115 (Create Return Lines Schema), BE-114 (Create Return Schema)
 * SRS Traceability: Section 10.1 (Core Entities: returns, return_lines),
 *                   FR-32 (material return requests / SRN),
 *                   FR-33 (technical evaluation of returned materials),
 *                   FR-34 (approval/rejection and stock update),
 *                   BR-13 (return stock updates after approval & disposition),
 *                   BR-21 (auditability and no hard-delete),
 *                   Clarification C-09 (disposition options)
 */

import { describe, it, expect } from 'vitest'
import {
  ReturnStatusEnum,
  ReturnDispositionEnum,
  returnLineSchema,
  createReturnSchema,
  updateReturnLineSchema,
} from '../../src/modules/returns/dto/return-line.dto.js'
import { Prisma } from '@prisma/client'

describe('BE-115: Return Lines Schema & DTO Tests', () => {
  describe('Prisma Model & Enum Definitions', () => {
    it('verifies ReturnStatus and ReturnDisposition enums are defined', () => {
      expect(ReturnStatusEnum.options).toEqual([
        'DRAFT',
        'SUBMITTED',
        'PENDING_EVALUATION',
        'EVALUATED',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'COMPLETED',
      ])

      expect(ReturnDispositionEnum.options).toEqual([
        'RESTOCK',
        'QUARANTINE',
        'REPAIR',
        'DISPOSAL',
        'REPLACEMENT',
      ])
    })

    it('verifies Prisma Decimal and ReturnLine model types are available', () => {
      const sampleCost = new Prisma.Decimal('1500.50')
      expect(sampleCost.toString()).toBe('1500.5')
      expect(sampleCost.toNumber()).toBe(1500.5)
    })
  })

  describe('return_lines: Valid Inserts & Field Constraints', () => {
    it('validates a minimal return line with required fields', () => {
      const minimalLine = {
        itemId: '550e8400-e29b-41d4-a716-446655440001',
        quantityReturned: 5,
      }

      const result = returnLineSchema.safeParse(minimalLine)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.itemId).toBe(minimalLine.itemId)
        expect(result.data.quantityReturned).toBe(5)
        expect(result.data.unitCost).toBeUndefined()
        expect(result.data.totalCost).toBeUndefined()
        expect(result.data.disposition).toBeUndefined()
      }
    })

    it('validates a complete return line with full metadata and SIV line link', () => {
      const completeLine = {
        itemId: '550e8400-e29b-41d4-a716-446655440001',
        sivLineId: '550e8400-e29b-41d4-a716-446655440002',
        quantityReturned: 2,
        unitCost: 1250.75,
        totalCost: 2501.5,
        condition: 'GOOD',
        disposition: 'RESTOCK',
        remarks: 'Returned in original manufacturer box with all accessories',
      }

      const result = returnLineSchema.safeParse(completeLine)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quantityReturned).toBe(2)
        expect(result.data.unitCost).toBe(1250.75)
        expect(result.data.totalCost).toBe(2501.5)
        expect(result.data.condition).toBe('GOOD')
        expect(result.data.disposition).toBe('RESTOCK')
        expect(result.data.sivLineId).toBe(completeLine.sivLineId)
      }
    })

    it('validates all allowed disposition enum values per Clarification C-09', () => {
      const dispositions = ['RESTOCK', 'QUARANTINE', 'REPAIR', 'DISPOSAL', 'REPLACEMENT']

      for (const disp of dispositions) {
        const line = {
          itemId: 'item-uuid-1',
          quantityReturned: 1,
          disposition: disp,
        }
        const result = returnLineSchema.safeParse(line)
        expect(result.success).toBe(true)
      }
    })

    it('calculates total cost accurately from quantity and unit cost', () => {
      const quantity = 4
      const unitCost = 350.25
      const expectedTotal = quantity * unitCost

      const line = {
        itemId: 'item-uuid-1',
        quantityReturned: quantity,
        unitCost: unitCost,
        totalCost: expectedTotal,
      }

      const result = returnLineSchema.safeParse(line)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalCost).toBe(1401.0)
      }
    })
  })

  describe('return_lines: Invalid Inserts & Check Constraints', () => {
    it('rejects zero quantity returned (CHECK quantity_returned > 0)', () => {
      const invalidLine = {
        itemId: 'item-uuid-1',
        quantityReturned: 0,
      }

      const result = returnLineSchema.safeParse(invalidLine)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issues = result.error.issues
        expect(issues.some((i) => i.message.includes('greater than zero'))).toBe(true)
      }
    })

    it('rejects negative quantity returned (CHECK quantity_returned > 0)', () => {
      const invalidLine = {
        itemId: 'item-uuid-1',
        quantityReturned: -3,
      }

      const result = returnLineSchema.safeParse(invalidLine)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issues = result.error.issues
        expect(issues.some((i) => i.message.includes('greater than zero'))).toBe(true)
      }
    })

    it('rejects decimal/fractional quantity returned', () => {
      const invalidLine = {
        itemId: 'item-uuid-1',
        quantityReturned: 2.5,
      }

      const result = returnLineSchema.safeParse(invalidLine)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issues = result.error.issues
        expect(issues.some((i) => i.message.includes('integer'))).toBe(true)
      }
    })

    it('rejects negative unit cost (CHECK unit_cost >= 0)', () => {
      const invalidLine = {
        itemId: 'item-uuid-1',
        quantityReturned: 2,
        unitCost: -50.0,
      }

      const result = returnLineSchema.safeParse(invalidLine)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issues = result.error.issues
        expect(issues.some((i) => i.message.includes('negative'))).toBe(true)
      }
    })

    it('rejects negative total cost (CHECK total_cost >= 0)', () => {
      const invalidLine = {
        itemId: 'item-uuid-1',
        quantityReturned: 2,
        totalCost: -100.0,
      }

      const result = returnLineSchema.safeParse(invalidLine)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issues = result.error.issues
        expect(issues.some((i) => i.message.includes('negative'))).toBe(true)
      }
    })

    it('rejects missing itemId', () => {
      const invalidLine = {
        quantityReturned: 2,
      }

      const result = returnLineSchema.safeParse(invalidLine)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issues = result.error.issues
        expect(issues.some((i) => i.path.includes('itemId'))).toBe(true)
      }
    })

    it('rejects invalid disposition enum value', () => {
      const invalidLine = {
        itemId: 'item-uuid-1',
        quantityReturned: 1,
        disposition: 'INVALID_DISPOSITION_CODE',
      }

      const result = returnLineSchema.safeParse(invalidLine)
      expect(result.success).toBe(false)
    })
  })

  describe('createReturnSchema: Composite & Document Rules', () => {
    it('validates a complete Store Return Note (SRN) with multiple lines', () => {
      const validReturn = {
        storeId: 'store-uuid-main-01',
        departmentId: 'dept-uuid-pao-01',
        sivId: 'siv-uuid-01',
        reason: 'Surplus equipment returned following department restructuring',
        requiresEvaluation: true,
        notes: 'Priority inspection requested',
        lines: [
          {
            itemId: 'item-uuid-laptop-01',
            quantityReturned: 2,
            unitCost: 1500.0,
            totalCost: 3000.0,
            condition: 'GOOD',
            disposition: 'RESTOCK',
          },
          {
            itemId: 'item-uuid-monitor-02',
            quantityReturned: 1,
            unitCost: 400.0,
            totalCost: 400.0,
            condition: 'DEFECTIVE',
            disposition: 'REPAIR',
          },
        ],
      }

      const result = createReturnSchema.safeParse(validReturn)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.lines).toHaveLength(2)
        expect(result.data.requiresEvaluation).toBe(true)
      }
    })

    it('rejects a return request with duplicate items (enforcing uq_return_line_item)', () => {
      const duplicateItemReturn = {
        storeId: 'store-uuid-main-01',
        reason: 'Project closeout return',
        lines: [
          {
            itemId: 'item-uuid-laptop-01',
            quantityReturned: 1,
          },
          {
            itemId: 'item-uuid-laptop-01', // duplicate itemId
            quantityReturned: 2,
          },
        ],
      }

      const result = createReturnSchema.safeParse(duplicateItemReturn)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes('Duplicate items within the same return request are not allowed')
          )
        ).toBe(true)
      }
    })

    it('rejects a return request with an empty lines array', () => {
      const emptyReturn = {
        storeId: 'store-uuid-main-01',
        reason: 'Empty return',
        lines: [],
      }

      const result = createReturnSchema.safeParse(emptyReturn)
      expect(result.success).toBe(false)
    })

    it('rejects a return request with too short reason', () => {
      const shortReasonReturn = {
        storeId: 'store-uuid-main-01',
        reason: 'No', // < 3 characters
        lines: [{ itemId: 'item-uuid-1', quantityReturned: 1 }],
      }

      const result = createReturnSchema.safeParse(shortReasonReturn)
      expect(result.success).toBe(false)
    })
  })

  describe('updateReturnLineSchema: Partial Updates', () => {
    it('allows updating quantityReturned and disposition', () => {
      const updatePayload = {
        quantityReturned: 3,
        disposition: 'QUARANTINE',
        remarks: 'Moved to quarantine pending secondary technical assessment',
      }

      const result = updateReturnLineSchema.safeParse(updatePayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quantityReturned).toBe(3)
        expect(result.data.disposition).toBe('QUARANTINE')
      }
    })

    it('rejects updating quantity to a non-positive integer', () => {
      const invalidUpdate = {
        quantityReturned: -1,
      }

      const result = updateReturnLineSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })
})
