/**
 * Reconciliation & Physical Stock Count Service
 * Task: BE-146 (Implement Reconciliation Approval API)
 * SRS Traceability: Section 12 (Stock Taking & Reconciliation), SRS BR-19
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Generate sequential Reconciliation Number REC-YYYY-XXXXX (SRS C-13)
 * @returns {Promise<string>}
 */
export async function generateReconciliationNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.reconciliation.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `REC-${year}-${sequence}`
}

/**
 * Create a new Reconciliation Session with lines & computed variance
 * @param {Object} params - { initiatedBy, storeId, countDate, reason, notes, lines }
 * @returns {Promise<Object>} Created Reconciliation record
 */
export async function createReconciliation({
  initiatedBy,
  storeId,
  countDate,
  reason,
  notes,
  lines = [],
}) {
  if (!initiatedBy) throw new ValidationError('initiatedBy user ID is required')
  if (!storeId) throw new ValidationError('storeId is required')

  const reconciliationNo = await generateReconciliationNumber()

  const processedLines = lines.map((line) => {
    const variance = line.physicalCount - line.systemQuantity
    const unitCost = line.unitCost ? Number(line.unitCost) : 0
    const varianceValue = variance * unitCost
    return {
      itemId: line.itemId,
      locationId: line.locationId || null,
      systemQuantity: line.systemQuantity,
      physicalCount: line.physicalCount,
      variance,
      unitCost: line.unitCost ? line.unitCost : null,
      varianceValue,
      remarks: line.remarks || null,
    }
  })

  const record = await prisma.reconciliation.create({
    data: {
      reconciliationNo,
      storeId,
      status: 'SUBMITTED',
      countDate: countDate ? new Date(countDate) : new Date(),
      initiatedBy,
      reason: reason || null,
      notes: notes || null,
      lines: {
        create: processedLines,
      },
    },
    include: {
      store: { select: { id: true, name: true, code: true } },
      initiatedByUser: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
        },
      },
    },
  })

  return record
}

/**
 * Get Reconciliation Session by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getReconciliationById(id) {
  const record = await prisma.reconciliation.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, code: true } },
      initiatedByUser: { select: { id: true, fullName: true, email: true } },
      approvedByUser: { select: { id: true, fullName: true, email: true } },
      postedByUser: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
        },
      },
    },
  })

  if (!record) {
    throw new NotFoundError(`Reconciliation session with ID '${id}' not found`)
  }

  return record
}

/**
 * List Reconciliation Sessions with filters and pagination
 * @param {Object} [filters={}] - { status, storeId, search, page, limit }
 * @returns {Promise<Object>}
 */
export async function listReconciliations(filters = {}) {
  const { status, storeId, search, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(storeId && { storeId }),
    ...(search && {
      OR: [
        { reconciliationNo: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [reconciliations, total] = await Promise.all([
    prisma.reconciliation.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        initiatedByUser: { select: { id: true, fullName: true } },
        _count: { select: { lines: true } },
      },
    }),
    prisma.reconciliation.count({ where }),
  ])

  return {
    reconciliations,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Approve or Reject Reconciliation Session (BE-146, SRS BR-19)
 * @param {Object} params - { id, approvedBy, approved, notes }
 * @returns {Promise<Object>}
 */
export async function approveReconciliation({ id, approvedBy, approved = true, notes }) {
  const record = await getReconciliationById(id)

  if (record.status !== 'SUBMITTED' && record.status !== 'PENDING_APPROVAL' && record.status !== 'DRAFT') {
    throw new ConflictError(`Cannot approve/reject reconciliation session in state '${record.status}'`)
  }

  const newStatus = approved ? 'APPROVED' : 'REJECTED'

  return prisma.reconciliation.update({
    where: { id },
    data: {
      status: newStatus,
      approvedBy,
      approvedAt: new Date(),
      ...(notes && { notes }),
    },
    include: {
      store: { select: { id: true, name: true } },
      initiatedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true } },
        },
      },
    },
  })
}
