/**
 * Central Asset Return Service & Lifecycle Engine
 * Aligned with Federal Government Property Administration Directive No. 1095/2017 & Stock Management Manual
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../utils/errors.js'
import { AssetReturnValidationService } from './asset-return-validation.service.js'
import { createAuditEvent, AUDIT_EVENT_TYPES } from '../audit/audit.service.js'
import {
  notifyApprovalPending,
  notifyStatusChange,
} from '../notifications/notification-events.service.js'

/**
 * Generate sequential Asset Return Number ARN-YYYY-XXXXX
 * @returns {Promise<string>}
 */
export async function generateAssetReturnNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.assetReturn.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `ARN-${year}-${sequence}`
}

/**
 * Initiate a Fixed Asset Return request
 * @param {Object} params - { assetId, reason, notes, user }
 * @returns {Promise<Object>} Created AssetReturn record
 */
export async function createAssetReturn({ assetId, reason, notes, user }) {
  const asset = await AssetReturnValidationService.validateReturnInitiation(assetId, user)

  const returnNumber = await generateAssetReturnNumber()
  const requesterId = user.id || user.userId

  const assetReturn = await prisma.$transaction(async (tx) => {
    const record = await tx.assetReturn.create({
      data: {
        returnNumber,
        assetId: asset.id,
        custodianId: asset.custodianId,
        requestedById: requesterId,
        status: 'PENDING_INSPECTION',
        reason,
        notes: notes || null,
      },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            serialNumber: true,
            status: true,
          },
        },
        custodian: { select: { id: true, fullName: true, email: true } },
        requestedByUser: { select: { id: true, fullName: true, email: true } },
      },
    })

    // Log immutable audit event
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES.ASSET_RETURN_CREATED,
      userId: requesterId,
      entityType: 'ASSET_RETURN',
      entityId: record.id,
      details: {
        returnNumber: record.returnNumber,
        assetId: asset.id,
        assetTag: asset.assetTag,
        custodianId: asset.custodianId,
        reason,
      },
    }, tx)

    return record
  })

  // Notify Property Administration / TEC of pending inspection (fire-and-forget)
  notifyApprovalPending({
    entityType: 'ASSET_RETURN',
    entityId: assetReturn.id,
    entityNumber: assetReturn.returnNumber,
    submitterId: requesterId,
  }).catch(() => {})

  return assetReturn
}

/**
 * Get Asset Return by ID
 * @param {string} id
 * @param {Object} [user=null] - Requesting user context
 * @returns {Promise<Object>}
 */
export async function getAssetReturnById(id, user = null) {
  const assetReturn = await prisma.assetReturn.findUnique({
    where: { id },
    include: {
      asset: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
        },
      },
      custodian: { select: { id: true, fullName: true, email: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      assignedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true, email: true } },
      assignedTecMembers: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
      inspection: {
        include: {
          inspector: { select: { id: true, fullName: true, email: true } },
        },
      },
      disposalRequest: {
        select: { id: true, disposalNumber: true, status: true },
      },
    },
  })

  if (!assetReturn) {
    throw new NotFoundError(`Asset Return with ID '${id}' not found`)
  }

  // If user is a TEC evaluator (and not Admin / PAO / Storekeeper), ensure they are assigned
  if (user) {
    const currentUserId = user.userId || user.id
    const userRoles = user.roles || (user.role ? [user.role] : [])
    const isPrivileged =
      userRoles.includes('ADMIN') ||
      userRoles.includes('SYSTEM_ADMIN') ||
      userRoles.includes('PAO') ||
      userRoles.includes('PROPERTY_ADMIN') ||
      userRoles.includes('STOREKEEPER')
    const isTecOnly = userRoles.includes('TEC') && !isPrivileged

    if (isTecOnly) {
      const isAssigned = assetReturn.assignedTecMembers?.some((m) => m.userId === currentUserId)
      if (!isAssigned) {
        throw new ForbiddenError('Access denied: you are only authorized to view asset returns assigned to you for inspection')
      }
    }
  }

  return assetReturn
}

/**
 * List Asset Returns with filtering and pagination
 * Enforces that TEC evaluators only see returns assigned to them
 * @param {Object} [filters={}] - { status, assetId, custodianId, requestedById, assignedTecId, search, page, limit }
 * @param {Object} [user=null] - Authenticated user context
 * @returns {Promise<Object>} { assetReturns, total, page, totalPages }
 */
export async function listAssetReturns(filters = {}, user = null) {
  const {
    status,
    assetId,
    custodianId,
    requestedById,
    assignedTecId,
    search,
    page = 1,
    limit = 10,
  } = filters

  const currentUserId = user?.userId || user?.id
  const userRoles = user?.roles || (user?.role ? [user.role] : [])
  const isPrivileged =
    userRoles.includes('ADMIN') ||
    userRoles.includes('SYSTEM_ADMIN') ||
    userRoles.includes('PAO') ||
    userRoles.includes('PROPERTY_ADMIN') ||
    userRoles.includes('STOREKEEPER')
  const isTecOnly = userRoles.includes('TEC') && !isPrivileged

  const effectiveTecId = isTecOnly ? currentUserId : assignedTecId

  const where = {
    ...(status && { status }),
    ...(assetId && { assetId }),
    ...(custodianId && { custodianId }),
    ...(requestedById && { requestedById }),
    ...(effectiveTecId && {
      assignedTecMembers: {
        some: { userId: effectiveTecId },
      },
    }),
    ...(search && {
      OR: [
        { returnNumber: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { asset: { name: { contains: search, mode: 'insensitive' } } },
        { asset: { assetTag: { contains: search, mode: 'insensitive' } } },
        { asset: { serialNumber: { contains: search, mode: 'insensitive' } } },
        { custodian: { fullName: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [assetReturns, total] = await Promise.all([
    prisma.assetReturn.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            serialNumber: true,
            status: true,
          },
        },
        custodian: { select: { id: true, fullName: true } },
        requestedByUser: { select: { id: true, fullName: true } },
        assignedTecMembers: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        inspection: {
          select: {
            decision: true,
            physicalCondition: true,
            technicalCondition: true,
            inspectionDate: true,
          },
        },
      },
    }),
    prisma.assetReturn.count({ where }),
  ])

  return {
    assetReturns,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Assign Technical Evaluation Committee (TEC) evaluators to a return
 * @param {Object} params - { id, tecUserIds, assignedByUserId }
 * @returns {Promise<Object>} Updated AssetReturn
 */
export async function assignTecMembers({ id, tecUserIds, assignedByUserId }) {
  const assetReturn = await getAssetReturnById(id)

  await AssetReturnValidationService.validateTecAssignment(assetReturn, tecUserIds)

  const updatedReturn = await prisma.$transaction(async (tx) => {
    // Delete any existing assignments for a clean update
    await tx.assetReturnTecMember.deleteMany({
      where: { assetReturnId: id },
    })

    // Create assignments
    await tx.assetReturnTecMember.createMany({
      data: tecUserIds.map((userId) => ({
        assetReturnId: id,
        userId,
      })),
    })

    const updated = await tx.assetReturn.update({
      where: { id },
      data: {
        status: 'UNDER_INSPECTION',
        assignedById: assignedByUserId,
        assignedAt: new Date(),
      },
      include: {
        asset: true,
        assignedTecMembers: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
      },
    })

    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES.ASSET_RETURN_TEC_ASSIGNED,
      userId: assignedByUserId,
      entityType: 'ASSET_RETURN',
      entityId: id,
      details: {
        returnNumber: assetReturn.returnNumber,
        assignedTecUserIds: tecUserIds,
      },
    }, tx)

    return updated
  })

  // Notify assigned TEC members
  for (const tecId of tecUserIds) {
    notifyStatusChange({
      userId: tecId,
      entityType: 'ASSET_RETURN',
      entityId: id,
      entityNumber: assetReturn.returnNumber,
      oldStatus: assetReturn.status,
      newStatus: 'UNDER_INSPECTION',
    }).catch(() => {})
  }

  return updatedReturn
}

/**
 * Record TEC technical inspection for an assigned committee evaluator
 * Supports multiple committee members submitting individual technical evaluations
 * @param {Object} params - { id, inspectionData, inspectorUser }
 * @returns {Promise<Object>} Updated AssetReturn record
 */
export async function recordInspectionAndDecision({ id, inspectionData, inspectorUser }) {
  const assetReturn = await getAssetReturnById(id)

  await AssetReturnValidationService.validateInspectionRecording(assetReturn, inspectorUser)

  const {
    physicalCondition,
    technicalCondition,
    isComplete = true,
    serialNumberVerified = true,
    assetTagVerified = true,
    observedDamage,
    missingAccessories,
    remarks,
    recommendation,
    decision,
  } = inspectionData

  const inspectorId = inspectorUser.id || inspectorUser.userId
  const effectiveRecommendation = decision || recommendation || 'ACCEPT_RETURN'

  return prisma.$transaction(async (tx) => {
    // 1. Update individual TEC committee member inspection record
    await tx.assetReturnTecMember.updateMany({
      where: {
        assetReturnId: id,
        userId: inspectorId,
      },
      data: {
        isEvaluated: true,
        evaluatedAt: new Date(),
        physicalCondition,
        technicalCondition,
        isComplete,
        serialNumberVerified,
        assetTagVerified,
        observedDamage: observedDamage || null,
        missingAccessories: missingAccessories || null,
        remarks: remarks || null,
        recommendation: effectiveRecommendation,
      },
    })

    // 2. Upsert consolidated inspection record for compatibility
    await tx.assetReturnInspection.upsert({
      where: { assetReturnId: id },
      create: {
        assetReturnId: id,
        inspectorId,
        physicalCondition,
        technicalCondition,
        isComplete,
        serialNumberVerified,
        assetTagVerified,
        observedDamage: observedDamage || null,
        missingAccessories: missingAccessories || null,
        remarks: remarks || null,
        recommendation: remarks || null,
        decision: effectiveRecommendation,
      },
      update: {
        inspectorId,
        physicalCondition,
        technicalCondition,
        isComplete,
        serialNumberVerified,
        assetTagVerified,
        observedDamage: observedDamage || null,
        missingAccessories: missingAccessories || null,
        remarks: remarks || null,
        recommendation: remarks || null,
        decision: effectiveRecommendation,
        inspectionDate: new Date(),
      },
    })

    // 3. Keep status as UNDER_INSPECTION while committee evaluation is ongoing
    const updatedReturn = await tx.assetReturn.update({
      where: { id },
      data: {
        status: 'UNDER_INSPECTION',
      },
      include: {
        asset: true,
        custodian: true,
        requestedByUser: true,
        assignedByUser: true,
        approvedByUser: { select: { id: true, fullName: true, email: true } },
        assignedTecMembers: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        inspection: {
          include: { inspector: { select: { id: true, fullName: true } } },
        },
      },
    })

    // 4. Log immutable audit event
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES.ASSET_RETURN_TEC_ASSIGNED,
      userId: inspectorId,
      entityType: 'ASSET_RETURN',
      entityId: id,
      details: {
        returnNumber: assetReturn.returnNumber,
        assetId: assetReturn.assetId,
        evaluatorId: inspectorId,
        physicalCondition,
        technicalCondition,
        recommendation: effectiveRecommendation,
      },
    }, tx)

    return updatedReturn
  })
}

/**
 * PAO Final Approval & Custody Resolution on Fixed Asset Return
 * Directive No. 1095/2017 & Stock Management Manual:
 * PAO can ONLY approve after ALL assigned TEC committee members have completed inspection!
 * @param {Object} params - { id, decision, approvalNotes, user }
 * @returns {Promise<Object>} Approved AssetReturn record
 */
export async function approveAssetReturn({ id, decision, approvalNotes, user }) {
  const assetReturn = await getAssetReturnById(id)

  const userRoles = user?.roles || (user?.role ? [user.role] : [])
  const isAuthorized =
    userRoles.includes('PAO') ||
    userRoles.includes('PROPERTY_ADMIN') ||
    userRoles.includes('ADMIN') ||
    userRoles.includes('SYSTEM_ADMIN')

  if (!isAuthorized) {
    throw new ForbiddenError('Only Property Administration Officers (PAO) or Administrators can approve fixed asset returns')
  }

  if (!['UNDER_INSPECTION', 'PENDING_INSPECTION'].includes(assetReturn.status)) {
    throw new ConflictError(`Asset return cannot be approved from current status '${assetReturn.status}'`)
  }

  // MANDATORY REQUIREMENT: All assigned TEC members must have completed inspection before PAO approval
  const assignedMembers = assetReturn.assignedTecMembers || []
  if (assignedMembers.length > 0) {
    const pendingMembers = assignedMembers.filter((m) => !m.isEvaluated)
    if (pendingMembers.length > 0) {
      const pendingNames = pendingMembers.map((m) => m.user?.fullName || m.userId).join(', ')
      throw new ConflictError(
        `Cannot approve asset return: ${pendingMembers.length} of ${assignedMembers.length} assigned TEC member(s) (${pendingNames}) have not completed evaluation yet. All assigned committee members must submit their inspection before PAO approval.`
      )
    }
  } else if (!assetReturn.inspection) {
    throw new ConflictError('Cannot approve asset return before Technical Evaluation Committee is assigned and inspection completed')
  }

  const validDecisions = ['ACCEPT_RETURN', 'ACCEPT_WITH_REPAIR', 'REJECT_RETURN', 'RECOMMEND_DISPOSAL']
  if (!validDecisions.includes(decision)) {
    throw new ValidationError(`Invalid decision '${decision}'. Allowed: ${validDecisions.join(', ')}`)
  }

  const paoUserId = user.id || user.userId

  return prisma.$transaction(async (tx) => {
    let targetReturnStatus = 'ACCEPTED'
    let targetAssetStatus = 'REGISTERED'
    let newCustodianId = null
    let auditEventType = AUDIT_EVENT_TYPES.ASSET_RETURN_ACCEPTED

    if (decision === 'ACCEPT_RETURN') {
      targetReturnStatus = 'ACCEPTED'
      targetAssetStatus = 'REGISTERED'
      newCustodianId = null
      auditEventType = AUDIT_EVENT_TYPES.ASSET_RETURN_ACCEPTED
    } else if (decision === 'ACCEPT_WITH_REPAIR') {
      targetReturnStatus = 'ACCEPTED_WITH_REPAIR'
      targetAssetStatus = 'UNDER_REPAIR'
      newCustodianId = null
      auditEventType = AUDIT_EVENT_TYPES.ASSET_RETURN_ACCEPTED_WITH_REPAIR
    } else if (decision === 'REJECT_RETURN') {
      targetReturnStatus = 'REJECTED'
      // Custody remains with User
      newCustodianId = assetReturn.custodianId
      targetAssetStatus = assetReturn.asset.status
      auditEventType = AUDIT_EVENT_TYPES.ASSET_RETURN_REJECTED
    } else if (decision === 'RECOMMEND_DISPOSAL') {
      targetReturnStatus = 'ACCEPTED'
      targetAssetStatus = 'RETIRED'
      newCustodianId = null
      auditEventType = AUDIT_EVENT_TYPES.ASSET_RETURN_DISPOSAL_RECOMMENDED
    }

    // 1. Update Fixed Asset Custody & Status
    // Directive 1095/2017: For accepted return, custodianId = null (asset returns to university pool)
    await tx.fixedAsset.update({
      where: { id: assetReturn.assetId },
      data: {
        custodianId: newCustodianId,
        status: targetAssetStatus,
        notes: assetReturn.asset.notes
          ? `${assetReturn.asset.notes} | Returned via ${assetReturn.returnNumber} (${decision})`
          : `Returned via ${assetReturn.returnNumber} (${decision})`,
      },
    })

    // 2. Update Asset Return record with PAO final approval
    const updatedReturn = await tx.assetReturn.update({
      where: { id },
      data: {
        status: targetReturnStatus,
        approvedById: paoUserId,
        approvedAt: new Date(),
        approvalNotes: approvalNotes || null,
        finalDecision: decision,
      },
      include: {
        asset: true,
        custodian: true,
        requestedByUser: true,
        assignedByUser: true,
        approvedByUser: { select: { id: true, fullName: true, email: true } },
        assignedTecMembers: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        inspection: {
          include: { inspector: { select: { id: true, fullName: true } } },
        },
      },
    })

    // 3. Log immutable audit event
    await createAuditEvent({
      eventType: auditEventType,
      userId: paoUserId,
      entityType: 'ASSET_RETURN',
      entityId: id,
      details: {
        returnNumber: assetReturn.returnNumber,
        assetId: assetReturn.assetId,
        decision,
        approvalNotes,
        previousCustodianId: assetReturn.custodianId,
        newCustodianId,
        newAssetStatus: targetAssetStatus,
      },
    }, tx)

    return updatedReturn
  })
}
