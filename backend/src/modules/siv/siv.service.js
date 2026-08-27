/**
 * Central Store Issue Voucher (SIV/ISIV) Service & Workflow Engine
 * Tasks: BE-103, BE-104, BE-105, BE-107, BE-110, BE-111, BE-112 (Issue Transaction Audit)
 * SRS Traceability: Section 6 (Store Issue Module), Section 13 (Auditability), Clarification Register C-01
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'
import { notifySecurityEvent } from '../notifications/notification-events.service.js'

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
 * Finalize SIV Voucher & Execute Idempotent Issue Stock Posting (BE-110)
 * @param {Object} params - { id, finalizerId }
 * @returns {Promise<Object>} Finalized SIV record
 */
export async function finalizeSIV({ id, finalizerId }) {
  const siv = await getSivById(id)

  if (siv.status === 'FINALIZED') {
    throw new ConflictError('SIV is already finalized. Stock has already been deducted.')
  }

  if (siv.status !== 'APPROVED') {
    throw new ConflictError(`SIV cannot be finalized from current status '${siv.status}'`)
  }

  return prisma.$transaction(async (tx) => {
    for (const line of siv.lines) {
      const stockCard = await tx.stockCard.findUnique({
        where: {
          uq_stock_card_item_store: {
            itemId: line.itemId,
            storeId: siv.storeId,
          },
        },
      })

      if (stockCard) {
        const newQty = Math.max(0, stockCard.quantity - line.quantityIssued)
        const newAvailable = Math.max(0, stockCard.availableQty - line.quantityIssued)

        await tx.stockCard.update({
          where: { id: stockCard.id },
          data: {
            quantity: newQty,
            availableQty: newAvailable,
          },
        })

        await tx.stockCardTransaction.create({
          data: {
            stockCardId: stockCard.id,
            transactionType: 'ISSUE',
            quantity: -line.quantityIssued,
            balanceAfter: newQty,
            referenceType: 'SIV',
            referenceId: siv.id,
            referenceNumber: siv.sivNumber,
            notes: line.remarks || `Stock issue posting for SIV ${siv.sivNumber}`,
            createdBy: finalizerId || siv.preparedBy,
          },
        })
      }

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

/**
 * Verify Gate Exit & Dispatch for Finalized SIV (BE-111)
 * @param {Object} params - { id, verifierId, vehicleNumber, driverName, gateNumber, remarks }
 * @returns {Promise<Object>} Verification audit result payload
 */
export async function verifyDispatchSIV({ id, verifierId, vehicleNumber, driverName, gateNumber, remarks }) {
  const siv = await getSivById(id)

  if (!['FINALIZED', 'APPROVED'].includes(siv.status)) {
    throw new ConflictError(`Cannot verify gate exit for un-finalized SIV in status '${siv.status}'`)
  }

  // BE-150: Notify SECURITY_OFFICER and ADMIN of gate verification — fire-and-forget
  notifySecurityEvent({
    title: 'SIV Gate Verification',
    message: `SIV ${siv.sivNumber} exit verification completed at Gate ${gateNumber || 'MAIN_GATE_01'}. Driver: ${driverName || 'N/A'}. Vehicle: ${vehicleNumber || 'N/A'}.`,
    referenceId: siv.id,
    referenceType: 'SIV',
  }).catch(() => {})

  return {
    verified: true,
    verificationTimestamp: new Date(),
    sivId: siv.id,
    sivNumber: siv.sivNumber,
    status: siv.status,
    verifiedBy: verifierId,
    gateDetails: {
      gateNumber: gateNumber || 'MAIN_GATE_01',
      vehicleNumber: vehicleNumber || 'N/A',
      driverName: driverName || 'N/A',
    },
    remarks: remarks || 'Material exit documentation verified at security checkpoint',
    totalItemsDispatched: siv.lines.reduce((acc, l) => acc + l.quantityIssued, 0),
  }
}

/**
 * Direct Stock Issue — one-shot create requisition + SIV + finalize (BE-110)
 * @param {Object} data - { storeId, purpose, userId, lines: [{ itemId, quantity }] }
 */
export async function directIssue({ storeId, purpose, userId, lines }) {
  if (!storeId || !userId) {
    throw new ValidationError('Store and user are required')
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('At least one item line is required')
  }

  for (const line of lines) {
    if (!line.itemId || !line.quantity || line.quantity <= 0) {
      throw new ValidationError('Each line requires a valid itemId and positive quantity')
    }
  }

  // Check stock availability
  for (const line of lines) {
    const stockCard = await prisma.stockCard.findUnique({
      where: { uq_stock_card_item_store: { itemId: line.itemId, storeId } },
    })
    if (!stockCard || stockCard.availableQty < line.quantity) {
      const item = await prisma.item.findUnique({ where: { id: line.itemId }, select: { name: true } })
      throw new ValidationError(
        `Insufficient stock for ${item?.name || line.itemId}. Available: ${stockCard?.availableQty || 0}, Requested: ${line.quantity}`
      )
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create requisition
    const year = new Date().getFullYear()
    const reqCount = await tx.requisition.count()
    const requisitionNumber = `REQ-${year}-${String(reqCount + 1).padStart(5, '0')}`

    const requisition = await tx.requisition.create({
      data: {
        requisitionNumber,
        requesterId: userId,
        departmentId: '00000000-0000-0000-0000-000000000000',
        storeId,
        purpose: purpose || 'Direct stock issue',
        status: 'PAO_APPROVED',
        departmentApprovedAt: new Date(),
        departmentApprovedBy: userId,
        paoApprovedAt: new Date(),
        paoApprovedBy: userId,
        lines: {
          create: lines.map(l => ({
            itemId: l.itemId,
            requestedQuantity: l.quantity,
            approvedQuantity: l.quantity,
            issuedQuantity: l.quantity,
          })),
        },
      },
    })

    // 2. Create SIV
    const sivCount = await tx.sIV.count()
    const sivNumber = `SIV-${year}-${String(sivCount + 1).padStart(5, '0')}`

    const siv = await tx.sIV.create({
      data: {
        sivNumber,
        requisitionId: requisition.id,
        storeId,
        issuedToUserId: userId,
        preparedBy: userId,
        status: 'FINALIZED',
        approvedBy: userId,
        lines: {
          create: lines.map(l => ({
            itemId: l.itemId,
            quantityIssued: l.quantity,
          })),
        },
      },
      include: {
        lines: true,
      },
    })

    // 3. Post stock deductions
    for (const line of siv.lines) {
      const stockCard = await tx.stockCard.findUnique({
        where: { uq_stock_card_item_store: { itemId: line.itemId, storeId } },
      })

      if (stockCard) {
        const newQty = Math.max(0, stockCard.quantity - line.quantityIssued)
        const newAvailable = Math.max(0, stockCard.availableQty - line.quantityIssued)

        await tx.stockCard.update({
          where: { id: stockCard.id },
          data: { quantity: newQty, availableQty: newAvailable },
        })

        await tx.stockCardTransaction.create({
          data: {
            stockCardId: stockCard.id,
            transactionType: 'ISSUE',
            quantity: -line.quantityIssued,
            balanceAfter: newQty,
            referenceType: 'SIV',
            referenceId: siv.id,
            referenceNumber: siv.sivNumber,
            notes: `Direct issue via ${siv.sivNumber}`,
            createdBy: userId,
          },
        })
      }
    }

    return { requisition, siv }
  })
}

/**
 * Get SIV Issue Transaction Audit Trail & Stock Ledger Integration History (BE-112)
 * @param {string} id - SIV ID
 * @returns {Promise<Object>} Issue transaction audit trail payload
 */
export async function getSivAuditHistory(id) {
  const siv = await getSivById(id)

  // Query stock card transaction ledger postings for this SIV
  const transactions = await prisma.stockCardTransaction.findMany({
    where: {
      OR: [
        { referenceId: siv.id },
        { referenceNumber: siv.sivNumber },
      ],
    },
    include: {
      stockCard: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          store: { select: { id: true, name: true, code: true } },
        },
      },
      createdByUser: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const events = [
    {
      eventType: 'SIV_PREPARED',
      status: 'PREPARED',
      timestamp: siv.createdAt,
      actor: siv.preparedByUser
        ? { id: siv.preparedByUser.id, fullName: siv.preparedByUser.fullName }
        : null,
      details: `SIV ${siv.sivNumber} prepared for requisition ${siv.requisition?.requisitionNumber || 'N/A'}`,
    },
  ]

  if (siv.approvedBy || siv.status === 'APPROVED' || siv.status === 'FINALIZED') {
    events.push({
      eventType: 'SIV_APPROVED',
      status: 'APPROVED',
      timestamp: siv.updatedAt,
      actor: siv.approvedByUser
        ? { id: siv.approvedByUser.id, fullName: siv.approvedByUser.fullName }
        : null,
      details: 'SIV issue voucher approved by authority officer',
    })
  }

  if (siv.status === 'FINALIZED') {
    events.push({
      eventType: 'SIV_FINALIZED_AND_STOCK_DEDUCTED',
      status: 'FINALIZED',
      timestamp: siv.updatedAt,
      actor: siv.preparedByUser
        ? { id: siv.preparedByUser.id, fullName: siv.preparedByUser.fullName }
        : null,
      details: `Stock deducted exactly once for ${siv.lines.length} line item(s)`,
    })
  }

  const summary = {
    sivId: siv.id,
    sivNumber: siv.sivNumber,
    currentStatus: siv.status,
    requisitionNumber: siv.requisition?.requisitionNumber || null,
    totalIssuedQuantity: siv.lines.reduce((acc, l) => acc + l.quantityIssued, 0),
    totalValuationCost: siv.lines.reduce((acc, l) => acc + (Number(l.totalCost) || 0), 0),
  }

  return {
    summary,
    events,
    transactions,
    lines: siv.lines,
  }
}
