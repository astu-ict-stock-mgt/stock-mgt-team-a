/**
 * Central Stock Return Note (SRN / Return) Service & Workflow Engine
 * Tasks: BE-114, BE-115, BE-116 (Implement Return Service)
 * SRS Traceability: Section 7 (Stock Return Module), Clarification Register C-09
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

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
 * @param {Object} data - { requisitionId, storeId, returnedBy, reason, notes, lines }
 * @returns {Promise<Object>} Created Return record
 */
export async function createReturn({ requisitionId, storeId, returnedBy, reason = 'UNUSED', notes, lines }) {
  if (!storeId || !returnedBy) {
    throw new ValidationError('Store ID and returnedBy user ID are required')
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

  return prisma.$transaction(async (tx) => {
    const returnRecord = await tx.return.create({
      data: {
        returnNumber,
        requisitionId: requisitionId || null,
        storeId,
        returnedBy,
        reason,
        notes: notes || null,
        status: 'SUBMITTED',
        lines: {
          create: lines.map((l) => ({
            itemId: l.itemId,
            quantityReturned: l.quantityReturned,
            condition: l.condition || 'GOOD',
            remarks: l.remarks || null,
          })),
        },
      },
      include: {
        requisition: { select: { id: true, requisitionNumber: true } },
        store: { select: { id: true, name: true, code: true } },
        returnedByUser: { select: { id: true, fullName: true, email: true } },
        lines: { include: { item: { select: { id: true, name: true, code: true } } } },
      },
    })

    return returnRecord
  })
}

/**
 * Get Return by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getReturnById(id) {
  const returnRecord = await prisma.return.findUnique({
    where: { id },
    include: {
      requisition: { select: { id: true, requisitionNumber: true } },
      store: { select: { id: true, name: true, code: true } },
      returnedByUser: { select: { id: true, fullName: true, email: true } },
      evaluatedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  if (!returnRecord) {
    throw new NotFoundError(`Return request with ID '${id}' not found`)
  }

  return returnRecord
}

/**
 * List Return requests with filters and pagination
 * @param {Object} [filters={}] - { status, storeId, returnedBy, page, limit }
 * @returns {Promise<Object>} { returns, total, page, totalPages }
 */
export async function listReturns(filters = {}) {
  const { status, storeId, returnedBy, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(storeId && { storeId }),
    ...(returnedBy && { returnedBy }),
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
        returnedByUser: { select: { id: true, fullName: true } },
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
 * @param {Object} params - { id, evaluatorId, remarks }
 * @returns {Promise<Object>} Evaluated Return record
 */
export async function evaluateReturn({ id, evaluatorId, remarks }) {
  const returnRecord = await getReturnById(id)

  if (!['DRAFT', 'SUBMITTED'].includes(returnRecord.status)) {
    throw new ConflictError(`Return request cannot be evaluated from current status '${returnRecord.status}'`)
  }

  return prisma.return.update({
    where: { id },
    data: {
      status: 'EVALUATED',
      evaluatedBy: evaluatorId,
      evaluatedAt: new Date(),
      ...(remarks && { notes: remarks }),
    },
    include: { lines: true },
  })
}

/**
 * Approve Return Request & Determine Stock Disposition (SRS Clarification C-09)
 * Dispositions allowed: RESTOCK | QUARANTINE | REPAIR | DISPOSAL | REPLACE
 * @param {Object} params - { id, approverId, disposition, remarks, isApproved }
 * @returns {Promise<Object>} Approved Return record
 */
export async function approveReturn({ id, approverId, disposition = 'RESTOCK', remarks, isApproved = true }) {
  const returnRecord = await getReturnById(id)

  if (!['SUBMITTED', 'EVALUATED'].includes(returnRecord.status)) {
    throw new ConflictError(`Return request cannot be approved from current status '${returnRecord.status}'`)
  }

  const validDispositions = ['RESTOCK', 'QUARANTINE', 'REPAIR', 'DISPOSAL', 'REPLACE']
  if (!validDispositions.includes(disposition)) {
    throw new ValidationError(`Invalid return disposition '${disposition}'. Allowed: ${validDispositions.join(', ')}`)
  }

  const targetStatus = isApproved ? 'APPROVED' : 'REJECTED'

  return prisma.return.update({
    where: { id },
    data: {
      status: targetStatus,
      disposition,
      approvedBy: approverId,
      approvedAt: new Date(),
      ...(remarks && { notes: remarks }),
    },
    include: { lines: true },
  })
}
