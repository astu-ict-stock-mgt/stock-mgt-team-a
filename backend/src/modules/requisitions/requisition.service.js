/**
 * Central Requisition Service & Workflow Engine
 * Tasks: BE-096, BE-097, BE-098 (Implement Requisition Service)
 * SRS Traceability: Section 6 (Requisition & Issue Module), Clarification Register C-01
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

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
  if (!requesterId || !departmentId || !storeId || !purpose) {
    throw new ValidationError('Requester, department, store, and purpose are required')
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('Requisition must contain at least one item line')
  }

  // Validate line items
  for (const line of lines) {
    if (!line.itemId || !line.requestedQuantity || line.requestedQuantity <= 0) {
      throw new ValidationError('Each requisition line requires a valid itemId and positive requestedQuantity')
    }
  }

  const requisitionNumber = await generateRequisitionNumber()

  return prisma.$transaction(async (tx) => {
    const requisition = await tx.requisition.create({
      data: {
        requisitionNumber,
        requesterId,
        departmentId,
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

    return requisition
  })
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

  return prisma.$transaction(async (tx) => {
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

    return tx.requisition.update({
      where: { id },
      data: {
        status: 'DEPARTMENT_APPROVED',
        departmentApprovedAt: new Date(),
        departmentApprovedBy: approverId,
      },
      include: { lines: true },
    })
  })
}

/**
 * PAO Approval
 * @param {Object} params - { id, paoUserId, lineApprovals }
 */
export async function approvePAORequisition({ id, paoUserId, lineApprovals }) {
  const requisition = await getRequisitionById(id)

  // Clarification C-01: Allows PAO approval from SUBMITTED or DEPARTMENT_APPROVED
  if (!['SUBMITTED', 'DEPARTMENT_APPROVED'].includes(requisition.status)) {
    throw new ConflictError(`Requisition cannot be PAO-approved from current state '${requisition.status}'`)
  }

  return prisma.$transaction(async (tx) => {
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

    return tx.requisition.update({
      where: { id },
      data: {
        status: 'PAO_APPROVED',
        paoApprovedAt: new Date(),
        paoApprovedBy: paoUserId,
      },
      include: { lines: true },
    })
  })
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

  return prisma.requisition.update({
    where: { id },
    data: {
      status: targetStatus,
      rejectionReason: reason || 'Requisition request rejected',
    },
  })
}
