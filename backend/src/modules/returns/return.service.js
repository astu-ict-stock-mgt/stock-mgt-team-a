/**
 * Central Stock Return Note (SRN / Return) Service & Workflow Engine
 * Tasks: BE-114, BE-115, BE-116, BE-120 (Implement Return Stock Posting)
 * SRS Traceability: Section 7 (Stock Return Module), SRS BR-13, Clarification Register C-09
 * BE-150: Notification events integrated — all calls are fire-and-forget.
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../utils/errors.js'
import {
  notifyApprovalPending,
  notifyStatusChange,
} from '../notifications/notification-events.service.js'
import { createAuditEvent, AUDIT_EVENT_TYPES } from '../audit/audit.service.js'

/**
 * Generate sequential Return Number SRN-YYYY-XXXXX
 * @returns {Promise<string>}
 */
export async function generateReturnNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.return.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `SRN-${year}-${sequence}`
}

/**
 * Create a new Store Return Note (SRN / Material Return Request)
 * Note per SRS BR-13: Creating a return request NEVER increases stock card balance.
 * @param {Object} data - { sivId, storeId, requestedById, reason, notes, lines }
 * @returns {Promise<Object>} Created Return record
 */
export async function createReturn({ sivId, storeId, requestedById, reason = 'UNUSED', notes, lines }) {
  if (!storeId || !requestedById) {
    throw new ValidationError('Store ID and requestedById user ID are required')
  }

  if (!sivId) {
    throw new ValidationError('SIV ID is required for a return request')
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('Return request must contain at least one item line')
  }

  for (const line of lines) {
    if (!line.itemId || !line.quantityReturned || line.quantityReturned <= 0) {
      throw new ValidationError('Each return line requires a valid itemId and positive quantityReturned')
    }
  }

  const returnNumber = await generateReturnNumber()

  const returnRecord = await prisma.$transaction(async (tx) => {
    const record = await tx.return.create({
      data: {
        returnNumber,
        sivId,
        storeId,
        requestedById,
        reason,
        notes: notes || null,
        status: 'SUBMITTED',
        lines: {
          create: lines.map((l) => ({
            itemId: l.itemId,
            returnedQuantity: l.quantityReturned,
            remarks: l.remarks || null,
          })),
        },
      },
      include: {
        siv: { select: { id: true, sivNumber: true } },
        store: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, fullName: true, email: true } },
        lines: { include: { item: { select: { id: true, name: true, code: true } } } },
      },
    })

    return record
  })

  // BE-150: Notify TEC + STOREKEEPER that a return awaits evaluation/approval
  notifyApprovalPending({
    entityType: 'RETURN',
    entityId: returnRecord.id,
    entityNumber: returnRecord.returnNumber,
    submitterId: requestedById,
  }).catch(() => {})

  return returnRecord
}


/**
 * Get Return by ID
 * @param {string} id 
 * @param {Object} [user=null] - Requesting user context
 * @returns {Promise<Object>}
 */
export async function getReturnById(id, user = null) {
  const returnRecord = await prisma.return.findUnique({
    where: { id },
    include: {
      siv: { select: { id: true, sivNumber: true } },
      store: { select: { id: true, name: true, code: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      assignedTecUser: { select: { id: true, fullName: true, email: true } },
      assignedTecMembers: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
      evaluatedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  if (!returnRecord) {
    throw new NotFoundError(`Return request with ID '${id}' not found`)
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
      const isAssigned =
        returnRecord.assignedTecId === currentUserId ||
        returnRecord.assignedTecMembers?.some((m) => m.userId === currentUserId)
      if (!isAssigned) {
        throw new ForbiddenError('Access denied: you are only authorized to view return requests assigned to you for inspection')
      }
    }
  }

  return returnRecord
}

/**
 * Assign TEC Evaluator(s) to Return Request (PAO / Admin)
 * Supports single tecUserId or multiple tecUserIds
 * @param {Object} params - { id, assignedById, tecUserId, tecUserIds }
 * @returns {Promise<Object>} Updated Return record
 */
export async function assignReturnTec({ id, assignedById, tecUserId, tecUserIds }) {
  const returnRecord = await getReturnById(id)

  if (returnRecord.status !== 'SUBMITTED') {
    throw new ConflictError(`Cannot assign TEC to return in status '${returnRecord.status}'`)
  }

  const ids = Array.isArray(tecUserIds) && tecUserIds.length > 0
    ? tecUserIds
    : tecUserId ? [tecUserId] : []

  if (ids.length === 0) {
    throw new ValidationError('At least one TEC evaluator ID is required')
  }

  const tecUsers = await prisma.user.findMany({
    where: { id: { in: ids } },
  })

  if (tecUsers.length === 0) {
    throw new NotFoundError('Selected TEC evaluator users were not found')
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Clear previous assignments
    await tx.returnTecMember.deleteMany({
      where: { returnId: id },
    })

    // Create new assignments
    await tx.returnTecMember.createMany({
      data: ids.map((uid) => ({
        returnId: id,
        userId: uid,
      })),
    })

    return tx.return.update({
      where: { id },
      data: {
        assignedTecId: ids[0],
        assignedAt: new Date(),
      },
      include: {
        siv: { select: { id: true, sivNumber: true } },
        store: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, fullName: true, email: true } },
        assignedTecUser: { select: { id: true, fullName: true, email: true } },
        assignedTecMembers: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        evaluatedByUser: { select: { id: true, fullName: true } },
        approvedByUser: { select: { id: true, fullName: true } },
        lines: { include: { item: { select: { id: true, name: true, code: true } } } },
      },
    })
  })

  const names = tecUsers.map((u) => u.fullName).join(', ')
  createAuditEvent({
    eventType: AUDIT_EVENT_TYPES.RETURN_TEC_ASSIGNED,
    userId: assignedById,
    details: `Assigned TEC evaluator(s) [${names}] to return request ${returnRecord.returnNumber}`,
  }).catch(() => {})

  for (const uid of ids) {
    notifyStatusChange({
      userId: uid,
      entityType: 'RETURN',
      entityId: returnRecord.id,
      entityNumber: returnRecord.returnNumber,
      oldStatus: 'SUBMITTED',
      newStatus: 'AWAITING_EVALUATION',
    }).catch(() => {})
  }

  return updated
}

/**
 * List Return requests with filters and pagination
 * Enforces that TEC evaluators only see returns assigned to them
 * @param {Object} [filters={}] - { status, storeId, requestedById, page, limit }
 * @param {Object} [user=null] - Authenticated user context
 * @returns {Promise<Object>} { returns, total, page, totalPages }
 */
export async function listReturns(filters = {}, user = null) {
  const { status, storeId, requestedById, page = 1, limit = 10 } = filters

  const currentUserId = user?.userId || user?.id
  const userRoles = user?.roles || (user?.role ? [user.role] : [])
  const isPrivileged =
    userRoles.includes('ADMIN') ||
    userRoles.includes('SYSTEM_ADMIN') ||
    userRoles.includes('PAO') ||
    userRoles.includes('PROPERTY_ADMIN') ||
    userRoles.includes('STOREKEEPER')
  const isTecOnly = userRoles.includes('TEC') && !isPrivileged

  const where = {
    ...(status && { status }),
    ...(storeId && { storeId }),
    ...(requestedById && { requestedById }),
    ...(isTecOnly && {
      OR: [
        { assignedTecId: currentUserId },
        { assignedTecMembers: { some: { userId: currentUserId } } },
      ],
    }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, fullName: true } },
        assignedTecUser: { select: { id: true, fullName: true } },
        assignedTecMembers: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        lines: true,
      },
    }),
    prisma.return.count({ where }),
  ])

  return {
    returns,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Perform Technical Evaluation on Returned Materials
 * Supports multiple committee members submitting individual technical findings
 * @param {Object} params - { id, evaluatorId, remarks, recommendation }
 * @returns {Promise<Object>} Evaluated Return record
 */
export async function evaluateReturn({ id, evaluatorId, remarks, recommendation }) {
  const returnRecord = await getReturnById(id)

  if (!['DRAFT', 'SUBMITTED', 'UNDER_EVALUATION'].includes(returnRecord.status)) {
    throw new ConflictError(`Return request cannot be evaluated from current status '${returnRecord.status}'`)
  }

  // If committee members are explicitly assigned, verify that this user is assigned
  const assignedMembers = returnRecord.assignedTecMembers || []
  if (assignedMembers.length > 0) {
    const isAssigned =
      returnRecord.assignedTecId === evaluatorId ||
      assignedMembers.some((m) => m.userId === evaluatorId)
    if (!isAssigned) {
      throw new ForbiddenError('You are not assigned as a TEC evaluator for this return request')
    }
  }

  // Update specific committee member evaluation entry if assigned
  if (assignedMembers.length > 0) {
    await prisma.returnTecMember.updateMany({
      where: {
        returnId: id,
        userId: evaluatorId,
      },
      data: {
        isEvaluated: true,
        evaluatedAt: new Date(),
        ...(remarks && { remarks }),
        ...(recommendation && { recommendation }),
      },
    })
  }

  const updated = await prisma.return.update({
    where: { id },
    data: {
      status: 'UNDER_EVALUATION',
      evaluatedBy: evaluatorId,
      evaluatedAt: new Date(),
      ...(remarks && { notes: remarks }),
      ...(recommendation && { evaluationResult: recommendation }),
    },
    include: {
      siv: { select: { id: true, sivNumber: true } },
      store: { select: { id: true, name: true, code: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      assignedTecUser: { select: { id: true, fullName: true, email: true } },
      assignedTecMembers: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
      evaluatedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  // BE-150: Notify requester their return was evaluated
  notifyStatusChange({
    userId: returnRecord.requestedById,
    entityType: 'RETURN',
    entityId: returnRecord.id,
    entityNumber: returnRecord.returnNumber,
    oldStatus: returnRecord.status,
    newStatus: 'UNDER_EVALUATION',
  }).catch(() => {})

  return updated
}

/**
 * Approve Return Request & Determine Stock Disposition (SRS Clarification C-09)
 * Dispositions allowed: RESTOCK | QUARANTINE | REPAIR | DISPOSAL | REPLACEMENT
 * Enforces rule: PAO can ONLY approve after ALL assigned TEC members have completed evaluation!
 * @param {Object} params - { id, approverId, disposition, remarks, isApproved }
 * @returns {Promise<Object>} Approved Return record
 */
export async function approveReturn({ id, approverId, disposition = 'RESTOCK', remarks, isApproved = true }) {
  const returnRecord = await getReturnById(id)

  if (!['UNDER_EVALUATION', 'SUBMITTED'].includes(returnRecord.status)) {
    throw new ConflictError(`Return request cannot be approved from current status: '${returnRecord.status}'`)
  }

  // MANDATORY REQUIREMENT: All assigned TEC members must have completed their evaluation before PAO approval
  const assignedMembers = returnRecord.assignedTecMembers || []
  if (assignedMembers.length > 0) {
    const pendingMembers = assignedMembers.filter((m) => !m.isEvaluated)
    if (pendingMembers.length > 0) {
      const pendingNames = pendingMembers.map((m) => m.user?.fullName || m.userId).join(', ')
      throw new ConflictError(
        `Cannot approve return: ${pendingMembers.length} of ${assignedMembers.length} assigned TEC member(s) (${pendingNames}) have not completed their technical evaluation yet. All assigned committee members must submit their evaluation before PAO approval.`
      )
    }
  } else if (!returnRecord.evaluatedBy) {
    throw new ConflictError('Return request cannot be approved before technical evaluation is completed')
  }

  const validDispositions = ['RESTOCK', 'QUARANTINE', 'REPAIR', 'DISPOSAL', 'REPLACEMENT']
  if (!validDispositions.includes(disposition)) {
    throw new ValidationError(`Invalid return disposition '${disposition}'. Allowed: ${validDispositions.join(', ')}`)
  }

  const targetStatus = isApproved ? 'APPROVED' : 'REJECTED'

  const updated = await prisma.return.update({
    where: { id },
    data: {
      status: targetStatus,
      disposition,
      approvedBy: approverId,
      approvedAt: new Date(),
      ...(remarks && { notes: remarks }),
    },
    include: {
      siv: { select: { id: true, sivNumber: true } },
      store: { select: { id: true, name: true, code: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      assignedTecUser: { select: { id: true, fullName: true, email: true } },
      assignedTecMembers: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
      evaluatedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  // BE-150: Notify requester of approval/rejection
  notifyStatusChange({
    userId: returnRecord.requestedById,
    entityType: 'RETURN',
    entityId: returnRecord.id,
    entityNumber: returnRecord.returnNumber,
    oldStatus: returnRecord.status,
    newStatus: targetStatus,
  }).catch(() => {})

  return updated
}

/**
 * Post Return Stock Card Ledger Entries (SRS BR-13 & BE-120)
 * Increases store active balance ONLY if disposition is RESTOCK after approval.
 * @param {Object} params - { id, postingUserId }
 * @returns {Promise<Object>} Updated Return record
 */
export async function postReturnStock({ id, postingUserId }) {
  const returnRecord = await getReturnById(id)

  if (returnRecord.status === 'APPROVED' && !returnRecord.disposition) {
    throw new ValidationError('Return disposition must be set before executing stock posting')
  }

  if (returnRecord.status !== 'APPROVED') {
    throw new ConflictError(`Return stock posting cannot be executed for status '${returnRecord.status}'`)
  }

  return prisma.$transaction(async (tx) => {
    // Execute stock increment ONLY if disposition is RESTOCK (BR-13)
    if (returnRecord.disposition === 'RESTOCK') {
      for (const line of returnRecord.lines) {
        let stockCard = await tx.stockCard.findUnique({
          where: {
            uq_stock_card_item_store: {
              itemId: line.itemId,
              storeId: returnRecord.storeId,
            },
          },
        })

        if (!stockCard) {
          stockCard = await tx.stockCard.create({
            data: {
              itemId: line.itemId,
              storeId: returnRecord.storeId,
              quantity: 0,
              availableQty: 0,
              reservedQty: 0,
            },
          })
        }

        const newQty = stockCard.quantity + line.returnedQuantity
        const newAvailable = stockCard.availableQty + line.returnedQuantity

        await tx.stockCard.update({
          where: { id: stockCard.id },
          data: {
            quantity: newQty,
            availableQty: newAvailable,
          },
        })

        // Record stock card ledger entry with transactionType = RETURN
        await tx.stockCardTransaction.create({
          data: {
            stockCardId: stockCard.id,
            transactionType: 'RETURN',
            quantity: line.returnedQuantity,
            balanceAfter: newQty,
            referenceType: 'SRN',
            referenceId: returnRecord.id,
            referenceNumber: returnRecord.returnNumber,
            notes: line.remarks || `Restock entry for return ${returnRecord.returnNumber}`,
            createdBy: postingUserId || returnRecord.requestedById,
          },
        })
      }
    }

    return returnRecord
  })
}
