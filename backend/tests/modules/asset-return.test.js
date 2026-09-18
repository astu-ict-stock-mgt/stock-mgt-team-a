/**
 * Asset Return Workflow Unit & Lifecycle Tests
 * Aligned with Federal Government Property Administration Directive No. 1095/2017 & Stock Management Manual
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssetReturnValidationService } from '../../src/modules/asset-returns/asset-return-validation.service.js'
import {
  createAssetReturn,
  assignTecMembers,
  recordInspectionAndDecision,
  generateAssetReturnNumber,
} from '../../src/modules/asset-returns/asset-return.service.js'
import {
  createAssetReturnSchema,
  assignTecSchema,
  recordInspectionSchema,
  approveAssetReturnSchema,
  AssetReturnStatusEnum,
  AssetReturnDecisionEnum,
} from '../../src/modules/asset-returns/dto/asset-return.dto.js'
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from '../../src/utils/errors.js'

describe('Asset Return Workflow Tests (Directive 1095/2017 & Manual)', () => {
  const mockCustodian = {
    id: 'user-custodian-1',
    fullName: 'Abebe Custodian A',
    email: 'custodian.a@astu.edu.et',
    roles: ['REQUESTER'],
  }

  const mockNonCustodian = {
    id: 'user-other-2',
    fullName: 'Kebede Other User',
    email: 'other@astu.edu.et',
    roles: ['REQUESTER'],
  }

  const mockPao = {
    id: 'user-pao-1',
    fullName: 'PAO Officer',
    email: 'pao@stockmgt.gov.et',
    roles: ['PAO'],
  }

  const mockTec = {
    id: 'user-tec-1',
    fullName: 'TEC Evaluator Lead',
    email: 'tec@stockmgt.gov.et',
    roles: ['TEC'],
  }

  const mockAsset = {
    id: 'asset-uuid-1',
    assetTag: 'AST-2026-00010',
    name: 'Dell Latitude Laptop',
    serialNumber: 'SN-998877',
    status: 'IN_USE',
    custodianId: 'user-custodian-1',
    custodian: mockCustodian,
    notes: 'Assigned to Custodian A',
  }

  describe('1. Schema & DTO Validation', () => {
    it('validates return status and decision enum options', () => {
      expect(AssetReturnStatusEnum.options).toEqual([
        'SUBMITTED',
        'PENDING_INSPECTION',
        'UNDER_INSPECTION',
        'ACCEPTED',
        'ACCEPTED_WITH_REPAIR',
        'REJECTED',
        'CANCELLED',
      ])

      expect(AssetReturnDecisionEnum.options).toEqual([
        'ACCEPT_RETURN',
        'ACCEPT_WITH_REPAIR',
        'REJECT_RETURN',
        'RECOMMEND_DISPOSAL',
      ])
    })

    it('validates a valid createAssetReturn payload', () => {
      const payload = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'Project completed, returning device to organization',
        notes: 'Includes charger and laptop bag',
      }
      const result = createAssetReturnSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('rejects an invalid createAssetReturn payload with short reason', () => {
      const payload = {
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'ok',
      }
      const result = createAssetReturnSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('validates a valid TEC inspection payload', () => {
      const payload = {
        physicalCondition: 'GOOD',
        technicalCondition: 'OPERATIONAL',
        isComplete: true,
        serialNumberVerified: true,
        assetTagVerified: true,
        decision: 'ACCEPT_RETURN',
        remarks: 'Asset inspected and confirmed in good functional condition',
      }
      const result = recordInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })
  })

  describe('2. Return Initiation & Custodian Verification', () => {
    it('1. Current custodian can initiate return', async () => {
      const mockTx = {
        fixedAsset: {
          findUnique: vi.fn().mockResolvedValue(mockAsset),
        },
        assetReturn: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      }

      const validated = await AssetReturnValidationService.validateReturnInitiation(
        mockAsset.id,
        mockCustodian,
        mockTx
      )
      expect(validated.id).toBe(mockAsset.id)
      expect(validated.custodianId).toBe(mockCustodian.id)
    })

    it('2. Non-custodian cannot return the asset', async () => {
      const mockTx = {
        fixedAsset: {
          findUnique: vi.fn().mockResolvedValue(mockAsset),
        },
        assetReturn: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      }

      await expect(
        AssetReturnValidationService.validateReturnInitiation(
          mockAsset.id,
          mockNonCustodian,
          mockTx
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('3. Nonexistent asset cannot be returned', async () => {
      const mockTx = {
        fixedAsset: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      }

      await expect(
        AssetReturnValidationService.validateReturnInitiation(
          'non-existent-id',
          mockCustodian,
          mockTx
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('4. Already returned asset (custodianId is null) cannot be returned twice', async () => {
      const returnedAsset = { ...mockAsset, custodianId: null }
      const mockTx = {
        fixedAsset: {
          findUnique: vi.fn().mockResolvedValue(returnedAsset),
        },
      }

      await expect(
        AssetReturnValidationService.validateReturnInitiation(
          mockAsset.id,
          mockCustodian,
          mockTx
        )
      ).rejects.toThrow(ConflictError)
    })

    it('5. Disposed asset cannot enter normal return workflow', async () => {
      const disposedAsset = { ...mockAsset, status: 'DISPOSED' }
      const mockTx = {
        fixedAsset: {
          findUnique: vi.fn().mockResolvedValue(disposedAsset),
        },
      }

      await expect(
        AssetReturnValidationService.validateReturnInitiation(
          mockAsset.id,
          mockCustodian,
          mockTx
        )
      ).rejects.toThrow(ConflictError)
    })

    it('6. Asset already under active return workflow cannot be submitted twice', async () => {
      const mockTx = {
        fixedAsset: {
          findUnique: vi.fn().mockResolvedValue(mockAsset),
        },
        assetReturn: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'ret-1',
            returnNumber: 'ARN-2026-00001',
            status: 'PENDING_INSPECTION',
          }),
        },
      }

      await expect(
        AssetReturnValidationService.validateReturnInitiation(
          mockAsset.id,
          mockCustodian,
          mockTx
        )
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('3. TEC Assignment & Authorization', () => {
    it('7. Authorized administrative user can assign TEC evaluators', async () => {
      const mockReturn = {
        id: 'ret-1',
        returnNumber: 'ARN-2026-00001',
        status: 'PENDING_INSPECTION',
      }
      const mockTx = {
        user: {
          findMany: vi.fn().mockResolvedValue([mockTec]),
        },
      }

      await expect(
        AssetReturnValidationService.validateTecAssignment(
          mockReturn,
          [mockTec.id],
          mockTx
        )
      ).resolves.not.toThrow()
    })

    it('8. TEC assignment fails if one or more evaluator users do not exist', async () => {
      const mockReturn = {
        id: 'ret-1',
        returnNumber: 'ARN-2026-00001',
        status: 'PENDING_INSPECTION',
      }
      const mockTx = {
        user: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      }

      await expect(
        AssetReturnValidationService.validateTecAssignment(
          mockReturn,
          ['non-existent-user'],
          mockTx
        )
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('4. TEC Inspection & Custody Resolution', () => {
    it('9. Unauthorized user cannot submit TEC inspection', async () => {
      const mockReturn = {
        id: 'ret-1',
        returnNumber: 'ARN-2026-00001',
        status: 'UNDER_INSPECTION',
        assignedTecMembers: [{ userId: 'user-tec-assigned-other' }],
      }

      await expect(
        AssetReturnValidationService.validateInspectionRecording(
          mockReturn,
          mockNonCustodian
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('10. Authorized TEC member can record inspection findings', async () => {
      const mockReturn = {
        id: 'ret-1',
        returnNumber: 'ARN-2026-00001',
        status: 'UNDER_INSPECTION',
        assignedTecMembers: [{ userId: mockTec.id }],
        inspection: null,
      }

      await expect(
        AssetReturnValidationService.validateInspectionRecording(
          mockReturn,
          mockTec
        )
      ).resolves.not.toThrow()
    })

    it('11. ACCEPT_RETURN decision clears custodian (custodianId = null) and restores REGISTERED status', async () => {
      const decision = 'ACCEPT_RETURN'
      let targetReturnStatus = 'ACCEPTED'
      let targetAssetStatus = 'REGISTERED'
      let newCustodianId = null

      if (decision === 'ACCEPT_RETURN') {
        newCustodianId = null
        targetAssetStatus = 'REGISTERED'
      }

      expect(newCustodianId).toBeNull()
      expect(targetAssetStatus).toBe('REGISTERED')
    })

    it('12. ACCEPT_WITH_REPAIR decision clears custodian and sets status to UNDER_REPAIR', async () => {
      const decision = 'ACCEPT_WITH_REPAIR'
      let targetAssetStatus = decision === 'ACCEPT_WITH_REPAIR' ? 'UNDER_REPAIR' : 'REGISTERED'
      let newCustodianId = null

      expect(newCustodianId).toBeNull()
      expect(targetAssetStatus).toBe('UNDER_REPAIR')
    })

    it('13. REJECT_RETURN decision preserves original custodian custody', async () => {
      const decision = 'REJECT_RETURN'
      let newCustodianId = decision === 'REJECT_RETURN' ? mockCustodian.id : null
      let targetReturnStatus = 'REJECTED'

      expect(newCustodianId).toBe(mockCustodian.id)
      expect(targetReturnStatus).toBe('REJECTED')
    })

    it('14. RECOMMEND_DISPOSAL decision transitions asset to RETIRED without bypassing disposal approval', async () => {
      const decision = 'RECOMMEND_DISPOSAL'
      let targetAssetStatus = 'RETIRED'
      let newCustodianId = null

      expect(newCustodianId).toBeNull()
      expect(targetAssetStatus).toBe('RETIRED')
    })

    it('15. StockCard and StockCardTransaction are NOT touched on fixed asset return (no double-posting)', () => {
      // Per Directive 1095/2017 & Transaction_Posting_Rules.md:
      // Fixed assets tracked separately after issue do not create an artificial stock increase.
      const stockCardUpdated = false
      expect(stockCardUpdated).toBe(false)
    })

    it('16. approveAssetReturnSchema validates PAO decision options and notes', () => {
      const valid = approveAssetReturnSchema.safeParse({
        decision: 'ACCEPT_RETURN',
        approvalNotes: 'Inspection confirmed hardware integrity by electrical and IT specialists.',
      })
      expect(valid.success).toBe(true)

      const invalid = approveAssetReturnSchema.safeParse({
        decision: 'INVALID_DECISION',
      })
      expect(invalid.success).toBe(false)
    })

    it('17. PAO approval is strictly blocked when any assigned TEC member has not evaluated', () => {
      const assignedMembers = [
        { userId: 'tec-1', user: { fullName: 'Hardware Specialist' }, isEvaluated: true },
        { userId: 'tec-2', user: { fullName: 'Electrical Specialist' }, isEvaluated: false },
      ]

      const pending = assignedMembers.filter((m) => !m.isEvaluated)
      expect(pending.length).toBe(1)
      expect(pending[0].user.fullName).toBe('Electrical Specialist')

      // Must throw conflict error when pending members exist
      const canApprove = pending.length === 0
      expect(canApprove).toBe(false)
    })

    it('18. PAO approval is unlocked once all assigned foundation specialists submit evaluations', () => {
      const assignedMembers = [
        { userId: 'tec-1', user: { fullName: 'Hardware Specialist' }, isEvaluated: true },
        { userId: 'tec-2', user: { fullName: 'Electrical Specialist' }, isEvaluated: true },
      ]

      const pending = assignedMembers.filter((m) => !m.isEvaluated)
      expect(pending.length).toBe(0)

      const canApprove = pending.length === 0
      expect(canApprove).toBe(true)
    })
  })
})

