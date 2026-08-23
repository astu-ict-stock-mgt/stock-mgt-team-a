/**
 * Central Disposal Request Service & Lifecycle Engine
 * Tasks: BE-136, BE-137 (Implement Disposal Request API)
 * SRS Traceability: Section 11 (Disposal Module), Clarification Register C-13
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Generate sequential Disposal Request Number DSP-YYYY-XXXXX (SRS C-13)
 * @returns {Promise<string>}
 */
export async function generateDisposalNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.disposalRequest.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `DSP-${year}-${sequence}`
}

/**
 * Create a new Disposal Request
 * @param {Object} params - { requestedBy, disposalMethod, storeId, reason, notes }
 * @returns {Promise<Object>} Created DisposalRequest record
 */
export async function createDisposalRequest({
  requestedBy,
  disposalMethod,
  storeId,
  reason,
  notes,
}) {
  if (!requestedBy) throw new ValidationError('requestedBy user ID is required')
  if (!disposalMethod) throw new ValidationError('disposalMethod is required')

  const validMethods = ['AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLING', 'TRANSFER_OUT']
  if (!validMethods.includes(disposalMethod)) {
    throw new ValidationError(`Invalid disposal method '${disposalMethod}'`)
  }

  const disposalNumber = await generateDisposalNumber()

  const record = await prisma.disposalRequest.create({
    data: {
      disposalNumber,
      disposalMethod,
      status: 'SUBMITTED',
      storeId: storeId || null,
      requestedBy,
      reason: reason || null,
      notes: notes || null,
    },
    include: {
      store: { select: { id: true, name: true, code: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
    },
  })

  return record
}

/**
 * Get Disposal Request by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getDisposalById(id) {
  const record = await prisma.disposalRequest.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, code: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      evaluatedByUser: { select: { id: true, fullName: true, email: true } },
      approvedByUser: { select: { id: true, fullName: true, email: true } },
      executedByUser: { select: { id: true, fullName: true, email: true } },
    },
  })

  if (!record) {
    throw new NotFoundError(`DisposalRequest with ID '${id}' not found`)
  }

  return record
}

/**
 * List Disposal Requests with filters and pagination
 * @param {Object} [filters={}] - { status, disposalMethod, storeId, search, page, limit }
 * @returns {Promise<Object>}
 */
export async function listDisposalRequests(filters = {}) {
  const { status, disposalMethod, storeId, search, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(disposalMethod && { disposalMethod }),
    ...(storeId && { storeId }),
    ...(search && {
      OR: [
        { disposalNumber: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [disposals, total] = await Promise.all([
    prisma.disposalRequest.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        requestedByUser: { select: { id: true, fullName: true } },
      },
    }),
    prisma.disposalRequest.count({ where }),
  ])

  return {
    disposals,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Committee Evaluation of Disposal Request
 * @param {Object} params - { id, evaluatedBy, notes }
 * @returns {Promise<Object>}
 */
export async function evaluateDisposalRequest({ id, evaluatedBy, notes }) {
  const record = await getDisposalById(id)

  if (record.status !== 'SUBMITTED' && record.status !== 'DRAFT') {
    throw new ConflictError(`Cannot evaluate disposal request in state '${record.status}'`)
  }

  return prisma.disposalRequest.update({
    where: { id },
    data: {
      status: 'EVALUATED',
      evaluatedBy,
      evaluatedAt: new Date(),
      ...(notes && { notes }),
    },
    include: {
      requestedByUser: { select: { id: true, fullName: true } },
      evaluatedByUser: { select: { id: true, fullName: true } },
    },
  })
}

/**
 * Approve or Reject Disposal Request
 * @param {Object} params - { id, approvedBy, approved, notes }
 * @returns {Promise<Object>}
 */
export async function approveDisposalRequest({ id, approvedBy, approved = true, notes }) {
  const record = await getDisposalById(id)

  if (record.status !== 'EVALUATED' && record.status !== 'SUBMITTED') {
    throw new ConflictError(`Cannot approve/reject disposal request in state '${record.status}'`)
  }

  const newStatus = approved ? 'APPROVED' : 'REJECTED'

  return prisma.disposalRequest.update({
    where: { id },
    data: {
      status: newStatus,
      approvedBy,
      approvedAt: new Date(),
      ...(notes && { notes }),
    },
    include: {
      requestedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
    },
  })
}
