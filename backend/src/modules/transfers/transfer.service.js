/**
 * Central Stock Transfer Request Service & Workflow Engine
 * Tasks: BE-121, BE-122, BE-123 (Implement Transfer Service)
 * SRS Traceability: Section 8 (Stock Transfer Module), Clarification Register C-10
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Generate sequential Transfer Request Number STR-YYYY-XXXXX
 * @returns {Promise<string>}
 */
export async function generateTransferNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.transferRequest.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `STR-${year}-${sequence}`
}

/**
 * Create a new Stock Transfer Request (STR)
 * @param {Object} data - { transferType, sourceStoreId, destinationStoreId, sourceLocationId, destinationLocationId, requestedBy, notes, lines }
 * @returns {Promise<Object>} Created TransferRequest record
 */
export async function createTransfer({
  transferType = 'STORE_TO_STORE',
  sourceStoreId,
  destinationStoreId,
  sourceLocationId,
  destinationLocationId,
  requestedBy,
  notes,
  lines,
}) {
  const validTransferTypes = ['BIN_TO_BIN', 'STORE_TO_STORE', 'DEPT_TO_STORE', 'STORE_TO_DEPT']
  if (!validTransferTypes.includes(transferType)) {
    throw new ValidationError(`Invalid transfer type '${transferType}'. Allowed: ${validTransferTypes.join(', ')}`)
  }

  if (!sourceStoreId || !destinationStoreId || !requestedBy) {
    throw new ValidationError('Source store ID, destination store ID, and requestedBy user ID are required')
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('Transfer request must contain at least one item line')
  }

  for (const line of lines) {
    if (!line.itemId || !line.quantityRequested || line.quantityRequested <= 0) {
      throw new ValidationError('Each transfer line requires a valid itemId and positive quantityRequested')
    }
  }

  const transferNumber = await generateTransferNumber()

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.create({
      data: {
        transferNumber,
        transferType,
        status: 'SUBMITTED',
        sourceStoreId,
        destinationStoreId,
        sourceLocationId: sourceLocationId || null,
        destinationLocationId: destinationLocationId || null,
        requestedBy,
        notes: notes || null,
        lines: {
          create: lines.map((l) => ({
            itemId: l.itemId,
            quantityRequested: l.quantityRequested,
            quantityTransferred: l.quantityRequested,
            remarks: l.remarks || null,
          })),
        },
      },
      include: {
        sourceStore: { select: { id: true, name: true, code: true } },
        destinationStore: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, fullName: true, email: true } },
        lines: { include: { item: { select: { id: true, name: true, code: true } } } },
      },
    })

    return transfer
  })
}

/**
 * Get Transfer Request by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getTransferById(id) {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id },
    include: {
      sourceStore: { select: { id: true, name: true, code: true } },
      destinationStore: { select: { id: true, name: true, code: true } },
      sourceLocation: { select: { id: true, name: true, code: true } },
      destinationLocation: { select: { id: true, name: true, code: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  if (!transfer) {
    throw new NotFoundError(`Transfer request with ID '${id}' not found`)
  }

  return transfer
}

/**
 * List Transfer requests with filters and pagination
 * @param {Object} [filters={}] - { status, transferType, sourceStoreId, destinationStoreId, page, limit }
 * @returns {Promise<Object>} { transfers, total, page, totalPages }
 */
export async function listTransfers(filters = {}) {
  const { status, transferType, sourceStoreId, destinationStoreId, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(transferType && { transferType }),
    ...(sourceStoreId && { sourceStoreId }),
    ...(destinationStoreId && { destinationStoreId }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [transfers, total] = await Promise.all([
    prisma.transferRequest.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        sourceStore: { select: { id: true, name: true, code: true } },
        destinationStore: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, fullName: true } },
        lines: true,
      },
    }),
    prisma.transferRequest.count({ where }),
  ])

  return {
    transfers,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Approve or Reject Stock Transfer Request
 * @param {Object} params - { id, approverId, notes, isApproved }
 * @returns {Promise<Object>} Approved or Rejected Transfer record
 */
export async function approveTransfer({ id, approverId, notes, isApproved = true }) {
  const transfer = await getTransferById(id)

  if (transfer.status !== 'SUBMITTED') {
    throw new ConflictError(`Transfer request cannot be approved from current status '${transfer.status}'`)
  }

  const targetStatus = isApproved ? 'APPROVED' : 'REJECTED'

  return prisma.transferRequest.update({
    where: { id },
    data: {
      status: targetStatus,
      approvedBy: approverId,
      approvedAt: new Date(),
      ...(notes && { notes }),
    },
    include: { lines: true },
  })
}

/**
 * Dispatch Stock Transfer Request (Status -> IN_TRANSIT)
 * @param {Object} params - { id }
 * @returns {Promise<Object>} Dispatched Transfer record
 */
export async function dispatchTransfer({ id }) {
  const transfer = await getTransferById(id)

  if (transfer.status !== 'APPROVED') {
    throw new ConflictError(`Transfer request cannot be dispatched from current status '${transfer.status}'`)
  }

  return prisma.transferRequest.update({
    where: { id },
    data: { status: 'IN_TRANSIT' },
    include: { lines: true },
  })
}

/**
 * Complete Stock Transfer Request (Status -> COMPLETED)
 * @param {Object} params - { id }
 * @returns {Promise<Object>} Completed Transfer record
 */
export async function completeTransfer({ id }) {
  const transfer = await getTransferById(id)

  if (transfer.status !== 'IN_TRANSIT') {
    throw new ConflictError(`Transfer request cannot be completed from current status '${transfer.status}'`)
  }

  return prisma.transferRequest.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: { lines: true },
  })
}
