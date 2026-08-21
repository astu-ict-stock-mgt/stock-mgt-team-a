/**
 * Central Store Issue Voucher (SIV/ISIV) Service & Workflow Engine
 * Tasks: BE-103, BE-104, BE-105, BE-107 (Implement SIV/ISIV Amendment API)
 * SRS Traceability: Section 6 (Store Issue Module), Clarification Register C-01
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Generate sequential SIV Number SIV-YYYY-XXXXX
 * @returns {Promise<string>}
 */
export async function generateSivNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.sIV.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `SIV-${year}-${sequence}`
}

/**
 * Create a new Store Issue Voucher (SIV)
 * @param {Object} data - { requisitionId, storeId, issuedToUserId, preparedBy, notes, lines }
 * @returns {Promise<Object>} Created SIV record
 */
export async function createSIV({ requisitionId, storeId, issuedToUserId, preparedBy, notes, lines }) {
  if (!requisitionId || !storeId || !issuedToUserId || !preparedBy) {
    throw new ValidationError('Requisition, store, recipient, and preparedBy user are required')
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('SIV must contain at least one item line')
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
  })

  if (!requisition) {
    throw new NotFoundError(`Requisition with ID '${requisitionId}' not found`)
  }

  if (!['PAO_APPROVED', 'DEPARTMENT_APPROVED', 'SUBMITTED'].includes(requisition.status)) {
    throw new ConflictError(`SIV cannot be issued for requisition in status '${requisition.status}'`)
  }

  for (const line of lines) {
    if (!line.itemId || !line.quantityIssued || line.quantityIssued <= 0) {
      throw new ValidationError('Each SIV line requires a valid itemId and positive quantityIssued')
    }
  }

  const sivNumber = await generateSivNumber()

  return prisma.$transaction(async (tx) => {
    const siv = await tx.sIV.create({
      data: {
        sivNumber,
        requisitionId,
        storeId,
        issuedToUserId,
        preparedBy,
        notes: notes || null,
        status: 'PREPARED',
        lines: {
          create: lines.map((l) => ({
            itemId: l.itemId,
            quantityIssued: l.quantityIssued,
            unitCost: l.unitCost || null,
            totalCost: l.unitCost ? l.unitCost * l.quantityIssued : null,
            remarks: l.remarks || null,
          })),
        },
      },
      include: {
        requisition: { select: { id: true, requisitionNumber: true, status: true } },
        store: { select: { id: true, name: true, code: true } },
        issuedToUser: { select: { id: true, fullName: true, email: true } },
        preparedByUser: { select: { id: true, fullName: true } },
        lines: { include: { item: { select: { id: true, name: true, code: true } } } },
      },
    })

    return siv
  })
}

/**
 * Get SIV by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getSivById(id) {
  const siv = await prisma.sIV.findUnique({
    where: { id },
    include: {
      requisition: { select: { id: true, requisitionNumber: true, status: true } },
      store: { select: { id: true, name: true, code: true } },
      issuedToUser: { select: { id: true, fullName: true, email: true } },
      preparedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: { include: { item: { select: { id: true, name: true, code: true } } } },
    },
  })

  if (!siv) {
    throw new NotFoundError(`SIV with ID '${id}' not found`)
  }

  return siv
}

/**
 * List SIV vouchers with filters and pagination
 * @param {Object} [filters={}] - { status, storeId, requisitionId, issuedToUserId, page, limit }
 * @returns {Promise<Object>} { sivs, total, page, totalPages }
 */
export async function listSivs(filters = {}) {
  const { status, storeId, requisitionId, issuedToUserId, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(storeId && { storeId }),
    ...(requisitionId && { requisitionId }),
    ...(issuedToUserId && { issuedToUserId }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [sivs, total] = await Promise.all([
    prisma.sIV.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        requisition: { select: { id: true, requisitionNumber: true } },
        store: { select: { id: true, name: true, code: true } },
        issuedToUser: { select: { id: true, fullName: true } },
        lines: true,
      },
    }),
    prisma.sIV.count({ where }),
  ])

  return {
    sivs,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Approve SIV Voucher
 * @param {Object} params - { id, approverId }
 */
export async function approveSIV({ id, approverId }) {
  const siv = await getSivById(id)

  if (siv.status !== 'PREPARED') {
    throw new ConflictError(`SIV cannot be approved from current status '${siv.status}'`)
  }

  return prisma.sIV.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: approverId,
    },
    include: { lines: true },
  })
}

/**
 * Finalize SIV Voucher & Update Requisition Line Issued Quantities
 * @param {Object} params - { id, finalizerId }
 */
export async function finalizeSIV({ id }) {
  const siv = await getSivById(id)

  if (siv.status !== 'APPROVED') {
    throw new ConflictError(`SIV cannot be finalized from current status '${siv.status}'`)
  }

  return prisma.$transaction(async (tx) => {
    for (const line of siv.lines) {
      await tx.requisitionLine.updateMany({
        where: {
          requisitionId: siv.requisitionId,
          itemId: line.itemId,
        },
        data: {
          issuedQuantity: { increment: line.quantityIssued },
        },
      })
    }

    return tx.sIV.update({
      where: { id },
      data: {
        status: 'FINALIZED',
      },
      include: { lines: true },
    })
  })
}

/**
 * Amend Preliminary SIV Voucher (BE-107)
 * @param {Object} params - { id, notes, issuedToUserId, lineAmendments }
 * @returns {Promise<Object>} Amended SIV record
 */
export async function amendSIV({ id, notes, issuedToUserId, lineAmendments }) {
  const siv = await getSivById(id)

  if (!['DRAFT', 'PREPARED'].includes(siv.status)) {
    throw new ConflictError(`SIV cannot be amended from current status '${siv.status}'`)
  }

  return prisma.$transaction(async (tx) => {
    if (Array.isArray(lineAmendments) && lineAmendments.length > 0) {
      for (const amendment of lineAmendments) {
        if (amendment.lineId && amendment.quantityIssued && amendment.quantityIssued > 0) {
          const existingLine = siv.lines.find((l) => l.id === amendment.lineId)
          const unitCost = existingLine?.unitCost ? Number(existingLine.unitCost) : null
          const totalCost = unitCost ? unitCost * amendment.quantityIssued : null

          await tx.sIVLine.update({
            where: { id: amendment.lineId },
            data: {
              quantityIssued: amendment.quantityIssued,
              totalCost,
              ...(amendment.remarks && { remarks: amendment.remarks }),
            },
          })
        }
      }
    }

    return tx.sIV.update({
      where: { id },
      data: {
        ...(notes && { notes }),
        ...(issuedToUserId && { issuedToUserId }),
      },
      include: { lines: true },
    })
  })
}
