/**
 * Central Requisition Service & Workflow Engine
 * Tasks: BE-096, BE-097, BE-098, BE-102 (Implement Requisition History)
 * SRS Traceability: Section 6 (Requisition & Issue Module), Section 13 (Auditability), Clarification Register C-01
 * BE-150: Notification events integrated — all calls are fire-and-forget.
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'
import {
  notifyApprovalPending,
  notifyStatusChange,
} from '../notifications/notification-events.service.js'

/**
 * Generate sequential Requisition Number REQ-YYYY-XXXXX
 * @returns {Promise<string>}
 */
export async function generateRequisitionNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.requisition.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `REQ-${year}-${sequence}`
}

/**
 * Create a new Store Material Requisition with items
 * @param {Object} data - { requesterId, departmentId, storeId, purpose, lines }
 * @returns {Promise<Object>} Created Requisition record
 */
export async function createRequisition({ requesterId, departmentId, storeId, purpose, lines }) {
  let finalDeptId = departmentId
  if (departmentId === '00000000-0000-0000-0000-000000000000' || !departmentId) {
    const firstDept = await prisma.department.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true },
    })
    if (firstDept) {
      finalDeptId = firstDept.id
    }
  }

  if (!requesterId || !finalDeptId || !storeId || !purpose) {
    throw new ValidationError('Requester, department, store, and purpose are required')
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('Requisition must contain at least one item line')
  }

  for (const line of lines) {
    if (!line.itemId || !line.requestedQuantity || line.requestedQuantity <= 0) {
      throw new ValidationError('Each requisition line requires a valid itemId and positive requestedQuantity')
    }
  }

  const requisitionNumber = await generateRequisitionNumber()

  const requisition = await prisma.requisition.create({
    data: {
      requisitionNumber,
      requesterId,
      departmentId: finalDeptId,
      storeId,
      purpose,
      status: 'SUBMITTED',
      lines: {
        create: lines.map((l) => ({
          itemId: l.itemId,
          requestedQuantity: l.requestedQuantity,
          remarks: l.remarks || null,
        })),
      },
    },
    include: {
      requester: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true, code: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  // BE-150: Notify approvers — fire-and-forget, cannot break main workflow
  notifyApprovalPending({
    entityType: 'REQUISITION',
    entityId: requisition.id,
    entityNumber: requisition.requisitionNumber,
    submitterId: requesterId,
  }).catch(() => {})

  return requisition
}

/**
 * Get Requisition by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getRequisitionById(id) {
  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true, code: true } },
      departmentApprovedByUser: { select: { id: true, fullName: true } },
      paoApprovedByUser: { select: { id: true, fullName: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  if (!requisition) {
    throw new NotFoundError(`Requisition with ID '${id}' not found`)
  }

  return requisition
}

/**
 * List Requisitions with filters and pagination
 * @param {Object} [filters={}] - { status, departmentId, storeId, requesterId, page, limit }
 * @returns {Promise<Object>} { requisitions, total, page, totalPages }
 */
export async function listRequisitions(filters = {}) {
  const { status, departmentId, storeId, requesterId, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(departmentId && { departmentId }),
    ...(storeId && { storeId }),
    ...(requesterId && { requesterId }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [requisitions, total] = await Promise.all([
    prisma.requisition.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        store: { select: { id: true, name: true, code: true } },
        lines: true,
      },
    }),
    prisma.requisition.count({ where }),
  ])

  return {
    requisitions,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Department Head Approval
 * @param {Object} params - { id, approverId, lineApprovals }
 */
export async function approveDepartmentRequisition({ id, approverId, lineApprovals }) {
  const requisition = await getRequisitionById(id)

  if (requisition.status !== 'SUBMITTED') {
    throw new ConflictError(`Requisition cannot be department-approved from current state '${requisition.status}'`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Array.isArray(lineApprovals) && lineApprovals.length > 0) {
      for (const lineApp of lineApprovals) {
        if (lineApp.lineId && typeof lineApp.approvedQuantity === 'number') {
          await tx.requisitionLine.update({
            where: { id: lineApp.lineId },
            data: { approvedQuantity: lineApp.approvedQuantity },
          })
        }
      }
    }

    const record = await tx.requisition.update({
      where: { id },
      data: {
        status: 'DEPARTMENT_APPROVED',
        departmentApprovedAt: new Date(),
        departmentApprovedBy: approverId,
      },
      include: { lines: true },
    })

    return record
  })

  // BE-150: Notify requester of department approval
  notifyStatusChange({
    userId: requisition.requesterId,
    entityType: 'REQUISITION',
    entityId: requisition.id,
    entityNumber: requisition.requisitionNumber,
    oldStatus: 'SUBMITTED',
    newStatus: 'DEPARTMENT_APPROVED',
  }).catch(() => {})

  return updated
}

/**
 * PAO Approval
 * @param {Object} params - { id, paoUserId, lineApprovals }
 */
export async function approvePAORequisition({ id, paoUserId, lineApprovals }) {
  const requisition = await getRequisitionById(id)

  if (requisition.status !== 'DEPARTMENT_APPROVED') {
    throw new ConflictError(`Requisition cannot be PAO-approved from current state '${requisition.status}'. It must first be approved at Department level (DEPARTMENT_APPROVED).`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Array.isArray(lineApprovals) && lineApprovals.length > 0) {
      for (const lineApp of lineApprovals) {
        if (lineApp.lineId && typeof lineApp.approvedQuantity === 'number') {
          await tx.requisitionLine.update({
            where: { id: lineApp.lineId },
            data: { approvedQuantity: lineApp.approvedQuantity },
          })
        }
      }
    }

    const record = await tx.requisition.update({
      where: { id },
      data: {
        status: 'PAO_APPROVED',
        paoApprovedAt: new Date(),
        paoApprovedBy: paoUserId,
      },
      include: { lines: true },
    })

    return record
  })

  // BE-150: Notify requester of PAO final approval
  notifyStatusChange({
    userId: requisition.requesterId,
    entityType: 'REQUISITION',
    entityId: requisition.id,
    entityNumber: requisition.requisitionNumber,
    oldStatus: requisition.status,
    newStatus: 'PAO_APPROVED',
  }).catch(() => {})

  return updated
}

/**
 * Reject Requisition (Department Head or PAO)
 * @param {Object} params - { id, rejectedByUserId, reason, level }
 */
export async function rejectRequisition({ id, rejectedByUserId, reason, level = 'DEPARTMENT' }) {
  const requisition = await getRequisitionById(id)

  if (['COMPLETED', 'CANCELLED', 'DEPARTMENT_REJECTED', 'PAO_REJECTED'].includes(requisition.status)) {
    throw new ConflictError(`Requisition is already in terminal state '${requisition.status}'`)
  }

  const targetStatus = level === 'PAO' ? 'PAO_REJECTED' : 'DEPARTMENT_REJECTED'

  const updated = await prisma.requisition.update({
    where: { id },
    data: {
      status: targetStatus,
      rejectionReason: reason || 'Requisition request rejected',
    },
  })

  // BE-150: Notify requester of rejection
  notifyStatusChange({
    userId: requisition.requesterId,
    entityType: 'REQUISITION',
    entityId: requisition.id,
    entityNumber: requisition.requisitionNumber,
    oldStatus: requisition.status,
    newStatus: targetStatus,
  }).catch(() => {})

  return updated
}

/**
 * Get Requisition History & Audit Event Timeline (BE-102)
 * @param {string} id - Requisition ID
 * @returns {Promise<Object>} History payload with events timeline and line quantities summary
 */
export async function getRequisitionHistory(id) {
  const requisition = await getRequisitionById(id)

  const events = [
    {
      eventType: 'REQUISITION_CREATED',
      status: 'SUBMITTED',
      timestamp: requisition.createdAt,
      actor: requisition.requester
        ? { id: requisition.requester.id, fullName: requisition.requester.fullName }
        : null,
      details: `Requisition ${requisition.requisitionNumber} created and submitted for purpose: '${requisition.purpose}'`,
    },
  ]

  if (requisition.departmentApprovedAt || requisition.status === 'DEPARTMENT_APPROVED') {
    events.push({
      eventType: 'DEPARTMENT_APPROVAL_DECISION',
      status: 'DEPARTMENT_APPROVED',
      timestamp: requisition.departmentApprovedAt || requisition.updatedAt,
      actor: requisition.departmentApprovedByUser
        ? { id: requisition.departmentApprovedByUser.id, fullName: requisition.departmentApprovedByUser.fullName }
        : null,
      details: 'Department Head approved the requisition request',
    })
  }

  if (requisition.status === 'DEPARTMENT_REJECTED') {
    events.push({
      eventType: 'DEPARTMENT_REJECTION_DECISION',
      status: 'DEPARTMENT_REJECTED',
      timestamp: requisition.updatedAt,
      actor: requisition.departmentApprovedByUser
        ? { id: requisition.departmentApprovedByUser.id, fullName: requisition.departmentApprovedByUser.fullName }
        : null,
      details: `Department Head rejected requisition. Reason: ${requisition.rejectionReason || 'N/A'}`,
    })
  }

  if (requisition.paoApprovedAt || requisition.status === 'PAO_APPROVED') {
    events.push({
      eventType: 'PAO_APPROVAL_DECISION',
      status: 'PAO_APPROVED',
      timestamp: requisition.paoApprovedAt || requisition.updatedAt,
      actor: requisition.paoApprovedByUser
        ? { id: requisition.paoApprovedByUser.id, fullName: requisition.paoApprovedByUser.fullName }
        : null,
      details: 'Property Administration Officer (PAO) approved the requisition',
    })
  }

  if (requisition.status === 'PAO_REJECTED') {
    events.push({
      eventType: 'PAO_REJECTION_DECISION',
      status: 'PAO_REJECTED',
      timestamp: requisition.updatedAt,
      actor: requisition.paoApprovedByUser
        ? { id: requisition.paoApprovedByUser.id, fullName: requisition.paoApprovedByUser.fullName }
        : null,
      details: `PAO rejected requisition. Reason: ${requisition.rejectionReason || 'N/A'}`,
    })
  }

  const summary = {
    requisitionId: requisition.id,
    requisitionNumber: requisition.requisitionNumber,
    currentStatus: requisition.status,
    totalRequestedItems: requisition.lines.reduce((acc, l) => acc + l.requestedQuantity, 0),
    totalApprovedItems: requisition.lines.reduce((acc, l) => acc + (l.approvedQuantity || 0), 0),
    totalIssuedItems: requisition.lines.reduce((acc, l) => acc + l.issuedQuantity, 0),
  }

  return {
    summary,
    events,
    lines: requisition.lines,
  }
}
