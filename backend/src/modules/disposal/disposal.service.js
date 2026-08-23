/**
 * Central Disposal Execution Service & Workflow Engine
 * Tasks: BE-136, BE-137, BE-138, BE-139, BE-140
 * SRS Traceability: Section 7.1 (Disposal State Model), Section 10.1, Section 13 (Auditability),
 *                   BR-18 (Disposal Policy), FR-38, FR-39, AT-09, Clarification C-12
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Generate sequential Disposal Request Number DISP-YYYY-XXXXX
 * @returns {Promise<string>}
 */
export async function generateDisposalNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.disposalRequest.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `DISP-${year}-${sequence}`
}

/**
 * Create a new Disposal Request (BE-137)
 * @param {Object} data - { storeId, requesterId, disposalMethod, reason, remarks, totalEstimatedValue, lines }
 * @returns {Promise<Object>} Created Disposal Request record
 */
export async function createDisposalRequest({
  storeId,
  requesterId,
  disposalMethod = 'WRITE_OFF',
  reason,
  remarks,
  totalEstimatedValue,
  lines,
}) {
  if (!storeId || !requesterId || !reason) {
    throw new ValidationError('Store, requester, and disposal reason are required')
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('Disposal request must contain at least one item line')
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
  })

  if (!store) {
    throw new NotFoundError(`Store with ID '${storeId}' not found`)
  }

  for (const line of lines) {
    if (!line.itemId || !line.quantity || line.quantity <= 0) {
      throw new ValidationError('Each disposal line requires a valid itemId and positive quantity')
    }

    const item = await prisma.item.findUnique({
      where: { id: line.itemId },
    })

    if (!item) {
      throw new NotFoundError(`Item with ID '${line.itemId}' not found`)
    }
  }

  const requestNumber = await generateDisposalNumber()

  return prisma.$transaction(async (tx) => {
    let computedTotalValue = totalEstimatedValue ? Number(totalEstimatedValue) : 0

    const linesData = lines.map((l) => {
      const unitCost = l.unitCost !== undefined && l.unitCost !== null ? Number(l.unitCost) : null
      const totalCost = unitCost !== null ? unitCost * l.quantity : null

      if (!totalEstimatedValue && totalCost !== null) {
        computedTotalValue += totalCost
      }

      return {
        itemId: l.itemId,
        locationId: l.locationId || null,
        quantity: l.quantity,
        unitCost: unitCost !== null ? unitCost : null,
        totalCost: totalCost !== null ? totalCost : null,
        condition: l.condition || null,
        batchNumber: l.batchNumber || null,
        expiryDate: l.expiryDate ? new Date(l.expiryDate) : null,
        remarks: l.remarks || null,
        status: 'PENDING',
      }
    })

    const disposal = await tx.disposalRequest.create({
      data: {
        requestNumber,
        storeId,
        requesterId,
        status: 'DRAFT',
        disposalMethod: disposalMethod || 'WRITE_OFF',
        reason,
        remarks: remarks || null,
        totalEstimatedValue: computedTotalValue > 0 ? computedTotalValue : null,
        lines: {
          create: linesData,
        },
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, fullName: true, email: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, code: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    return disposal
  })
}

/**
 * Get Disposal Request by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getDisposalById(id) {
  const disposal = await prisma.disposalRequest.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, fullName: true, email: true } },
      reviewedByUser: { select: { id: true, fullName: true, email: true } },
      approvedByUser: { select: { id: true, fullName: true, email: true } },
      executedByUser: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true, unitCost: true } },
          location: { select: { id: true, name: true, code: true } },
        },
      },
    },
  })

  if (!disposal) {
    throw new NotFoundError(`Disposal request with ID '${id}' not found`)
  }

  return disposal
}

/**
 * List Disposal Requests with filters and pagination
 * @param {Object} [filters={}] - { status, storeId, requesterId, disposalMethod, page, limit }
 * @returns {Promise<Object>} { disposalRequests, total, page, totalPages }
 */
export async function listDisposalRequests(filters = {}) {
  const { status, storeId, requesterId, disposalMethod, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(storeId && { storeId }),
    ...(requesterId && { requesterId }),
    ...(disposalMethod && { disposalMethod }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [disposalRequests, total] = await Promise.all([
    prisma.disposalRequest.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, fullName: true } },
        approvedByUser: { select: { id: true, fullName: true } },
        executedByUser: { select: { id: true, fullName: true } },
        lines: true,
      },
    }),
    prisma.disposalRequest.count({ where }),
  ])

  return {
    disposalRequests,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Approve Disposal Request (BE-138)
 * @param {Object} params - { id, approverId, approvalNotes, disposalMethod }
 * @returns {Promise<Object>} Approved Disposal Request record
 */
export async function approveDisposalRequest({ id, approverId, approvalNotes, disposalMethod }) {
  const disposal = await getDisposalById(id)

  if (!['DRAFT', 'PENDING_APPROVAL'].includes(disposal.status)) {
    throw new ConflictError(
      `Disposal request cannot be approved from current status '${disposal.status}'. Must be DRAFT or PENDING_APPROVAL.`
    )
  }

  return prisma.disposalRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: approverId,
      approvedAt: new Date(),
      approvalNotes: approvalNotes || null,
      ...(disposalMethod && { disposalMethod }),
    },
    include: {
      store: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
        },
      },
    },
  })
}

/**
 * Reject Disposal Request (BE-138)
 * @param {Object} params - { id, rejectedById, rejectionReason }
 * @returns {Promise<Object>} Rejected Disposal Request record
 */
export async function rejectDisposalRequest({ id, rejectedById, rejectionReason }) {
  if (!rejectionReason) {
    throw new ValidationError('Rejection reason is required')
  }

  const disposal = await getDisposalById(id)

  if (['EXECUTED', 'CANCELLED'].includes(disposal.status)) {
    throw new ConflictError(`Disposal request cannot be rejected from status '${disposal.status}'`)
  }

  return prisma.disposalRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason,
      approvedBy: rejectedById,
      approvedAt: new Date(),
    },
    include: {
      store: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: true,
    },
  })
}

/**
 * Execute Disposal & Perform Idempotent Transactional Stock Deduction (BE-139, BE-086)
 * 
 * Enforces:
 * 1. State machine rule: Must be in 'APPROVED' status.
 * 2. Idempotency: Cannot execute already executed request.
 * 3. Stock sufficiency check on stock_cards and bin_cards.
 * 4. Atomic PostgreSQL transaction posting:
 *    - Decrement stock_cards (quantity & availableQty).
 *    - Write immutable stock_card_transactions record (transactionType: 'DISPOSAL').
 *    - Decrement bin_cards & write bin_transactions if location specified.
 *    - Update disposal_requests to 'EXECUTED' with execution metadata.
 * 
 * @param {Object} params - { id, executedBy, executionNotes, witnessName, certificateNumber, disposalLocation }
 * @returns {Promise<Object>} Executed Disposal Request record
 */
export async function executeDisposal({
  id,
  executedBy,
  executionNotes,
  witnessName,
  certificateNumber,
  disposalLocation,
}) {
  const disposal = await getDisposalById(id)

  // 1. Idempotency Guard (BR-11, BR-18)
  if (disposal.status === 'EXECUTED') {
    throw new ConflictError('Disposal request has already been executed. Stock has already been deducted.')
  }

  // 2. Status Precondition Guard (SRS §7.1)
  if (disposal.status !== 'APPROVED') {
    throw new ConflictError(
      `Disposal request cannot be executed from status '${disposal.status}'. It must be in 'APPROVED' status.`
    )
  }

  if (!Array.isArray(disposal.lines) || disposal.lines.length === 0) {
    throw new ValidationError('Disposal request has no line items to execute')
  }

  // 3. Execute Transactional Stock Deduction (BE-086, SRS §9.4, BR-18)
  return prisma.$transaction(async (tx) => {
    for (const line of disposal.lines) {
      // Check stock balance in store
      const stockCard = await tx.stockCard.findUnique({
        where: {
          itemId_storeId: {
            itemId: line.itemId,
            storeId: disposal.storeId,
          },
        },
      })

      if (!stockCard || stockCard.availableQty < line.quantity) {
        throw new ConflictError(
          `Insufficient stock available for disposal of item '${line.item?.name || line.itemId}'. Available: ${
            stockCard?.availableQty || 0
          }, Requested: ${line.quantity}`
        )
      }

      const newQuantity = stockCard.quantity - line.quantity
      const newAvailableQty = stockCard.availableQty - line.quantity

      // Update perpetual Stock Card balance
      await tx.stockCard.update({
        where: { id: stockCard.id },
        data: {
          quantity: newQuantity,
          availableQty: newAvailableQty,
          lastMovementAt: new Date(),
        },
      })

      // Create immutable Stock Card Transaction
      await tx.stockCardTransaction.create({
        data: {
          stockCardId: stockCard.id,
          transactionType: 'DISPOSAL',
          quantity: -line.quantity,
          referenceType: 'DISPOSAL_REQUEST',
          referenceId: disposal.id,
          referenceNumber: disposal.requestNumber,
          notes:
            executionNotes ||
            line.remarks ||
            `Disposal execution under certificate ${certificateNumber || 'N/A'} for request ${disposal.requestNumber}`,
          createdBy: executedBy || disposal.requesterId,
        },
      })

      // If location/bin is specified, decrement bin card balance
      if (line.locationId) {
        const binCard = await tx.binCard.findUnique({
          where: {
            itemId_locationId: {
              itemId: line.itemId,
              locationId: line.locationId,
            },
          },
        })

        if (binCard) {
          const newBinQuantity = Math.max(0, binCard.quantity - line.quantity)
          await tx.binCard.update({
            where: { id: binCard.id },
            data: {
              quantity: newBinQuantity,
              lastMovementAt: new Date(),
            },
          })

          await tx.binTransaction.create({
            data: {
              binCardId: binCard.id,
              transactionType: 'DISPOSAL',
              quantity: -line.quantity,
              referenceType: 'DISPOSAL_REQUEST',
              referenceId: disposal.id,
              referenceNumber: disposal.requestNumber,
              notes: executionNotes || `Disposal execution for request ${disposal.requestNumber}`,
              createdBy: executedBy || disposal.requesterId,
            },
          })
        }
      }

      // Update disposal line item status
      await tx.disposalRequestLine.update({
        where: { id: line.id },
        data: {
          status: 'EXECUTED',
        },
      })
    }

    // Update Disposal Request header to EXECUTED
    const executedRecord = await tx.disposalRequest.update({
      where: { id },
      data: {
        status: 'EXECUTED',
        executedBy: executedBy || null,
        executedAt: new Date(),
        executionNotes: executionNotes || null,
        witnessName: witnessName || null,
        certificateNumber: certificateNumber || null,
        disposalLocation: disposalLocation || null,
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, fullName: true, email: true } },
        approvedByUser: { select: { id: true, fullName: true, email: true } },
        executedByUser: { select: { id: true, fullName: true, email: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, code: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    return executedRecord
  })
}

/**
 * Get Disposal Audit Trail & Stock Ledger Integration History (BE-140)
 * @param {string} id - Disposal Request ID
 * @returns {Promise<Object>} Audit history payload
 */
export async function getDisposalAuditHistory(id) {
  const disposal = await getDisposalById(id)

  const transactions = await prisma.stockCardTransaction.findMany({
    where: {
      OR: [
        { referenceId: disposal.id },
        { referenceNumber: disposal.requestNumber },
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
      eventType: 'DISPOSAL_REQUEST_CREATED',
      status: 'DRAFT',
      timestamp: disposal.createdAt,
      actor: disposal.requester
        ? { id: disposal.requester.id, fullName: disposal.requester.fullName }
        : null,
      details: `Disposal request ${disposal.requestNumber} created for store ${disposal.store?.name || 'N/A'}. Method: ${disposal.disposalMethod}. Reason: ${disposal.reason}`,
    },
  ]

  if (disposal.approvedBy || ['APPROVED', 'EXECUTED'].includes(disposal.status)) {
    events.push({
      eventType: 'DISPOSAL_REQUEST_APPROVED',
      status: 'APPROVED',
      timestamp: disposal.approvedAt || disposal.updatedAt,
      actor: disposal.approvedByUser
        ? { id: disposal.approvedByUser.id, fullName: disposal.approvedByUser.fullName }
        : null,
      details: `Disposal request approved by authorized officer. Notes: ${disposal.approvalNotes || 'None'}`,
    })
  }

  if (disposal.status === 'REJECTED') {
    events.push({
      eventType: 'DISPOSAL_REQUEST_REJECTED',
      status: 'REJECTED',
      timestamp: disposal.updatedAt,
      actor: disposal.approvedByUser
        ? { id: disposal.approvedByUser.id, fullName: disposal.approvedByUser.fullName }
        : null,
      details: `Disposal request rejected. Reason: ${disposal.rejectionReason || 'N/A'}`,
    })
  }

  if (disposal.status === 'EXECUTED') {
    events.push({
      eventType: 'DISPOSAL_EXECUTED_AND_STOCK_DEDUCTED',
      status: 'EXECUTED',
      timestamp: disposal.executedAt || disposal.updatedAt,
      actor: disposal.executedByUser
        ? { id: disposal.executedByUser.id, fullName: disposal.executedByUser.fullName }
        : null,
      details: `Disposal executed. Certificate: ${disposal.certificateNumber || 'N/A'}. Witness: ${
        disposal.witnessName || 'N/A'
      }. Location: ${disposal.disposalLocation || 'N/A'}. Stock deducted for ${disposal.lines.length} line item(s).`,
    })
  }

  const summary = {
    disposalId: disposal.id,
    requestNumber: disposal.requestNumber,
    currentStatus: disposal.status,
    disposalMethod: disposal.disposalMethod,
    totalItemsDisposed: disposal.lines.reduce((acc, l) => acc + l.quantity, 0),
    totalEstimatedValue: disposal.totalEstimatedValue || null,
    certificateNumber: disposal.certificateNumber || null,
    witnessName: disposal.witnessName || null,
  }

  return {
    summary,
    events,
    transactions,
    lines: disposal.lines,
  }
}
