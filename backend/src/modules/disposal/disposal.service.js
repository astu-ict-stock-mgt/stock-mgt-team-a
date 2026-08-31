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
 * @param {Object} data - { storeId, requestedBy, disposalMethod, reason, notes, lines }
 * @returns {Promise<Object>} Created Disposal Request record
 */
export async function createDisposalRequest({
  storeId,
  requestedBy,
  disposalMethod = 'WRITE_OFF',
  reason,
  notes,
  lines,
}) {
  if (!requestedBy) {
    throw new ValidationError('requestedBy user ID is required')
  }
  if (!disposalMethod) {
    throw new ValidationError('disposalMethod is required')
  }

  const validMethods = ['AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLING', 'TRANSFER_OUT', 'WRITE_OFF']
  if (!validMethods.includes(disposalMethod)) {
    throw new ValidationError(`Invalid disposal method '${disposalMethod}'`)
  }

  const disposalNumber = await generateDisposalNumber()

  const populatedLines = []
  if (Array.isArray(lines) && lines.length > 0) {
    for (const line of lines) {
      if (!line.itemId) {
        throw new ValidationError('itemId is required for each disposal request line')
      }
      if (!line.quantity || line.quantity <= 0) {
        throw new ValidationError('quantity must be greater than 0 for each line')
      }
      const item = await prisma.item.findUnique({ where: { id: line.itemId } })
      if (!item) {
        throw new ValidationError(`Item with ID '${line.itemId}' not found`)
      }
      let stockCard = null
      let unitCost = item.unitCost ? Number(item.unitCost) : 0
      let totalCost = unitCost * line.quantity

      if (storeId) {
        stockCard = await prisma.stockCard.findUnique({
          where: {
            uq_stock_card_item_store: {
              itemId: line.itemId,
              storeId: storeId,
            }
          }
        })
        
        if (stockCard) {
          const batches = await prisma.stockBatch.findMany({
            where: { stockCardId: stockCard.id, remainingQty: { gt: 0 } },
            orderBy: { receivedAt: 'asc' }
          })
          
          let remainingToEstimate = line.quantity
          let calculatedTotalCost = 0
          
          for (const batch of batches) {
            if (remainingToEstimate <= 0) break
            const takeQty = Math.min(batch.remainingQty, remainingToEstimate)
            calculatedTotalCost += takeQty * Number(batch.unitCost)
            remainingToEstimate -= takeQty
          }
          
          if (remainingToEstimate > 0 && batches.length > 0) {
            calculatedTotalCost += remainingToEstimate * Number(batches[batches.length - 1].unitCost)
          } else if (remainingToEstimate > 0 && batches.length === 0) {
            calculatedTotalCost += remainingToEstimate * unitCost
          }
          
          totalCost = calculatedTotalCost
          unitCost = totalCost / line.quantity
        }
      }
      populatedLines.push({
        itemId: line.itemId,
        quantity: line.quantity,
        locationId: line.locationId || null,
        unitCost,
        totalCost,
        remarks: line.remarks || null,
        condition: line.condition || null,
        batchNumber: line.batchNumber || null,
        expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
      })
    }
  }

  const record = await prisma.disposalRequest.create({
    data: {
      disposalNumber,
      disposalMethod,
      status: 'DRAFT',
      storeId: storeId || null,
      requestedBy,
      reason: reason || null,
      notes: notes || null,
      lines: {
        create: populatedLines
      }
    },
    include: {
      store: { select: { id: true, name: true, code: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
        }
      }
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
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
        },
      },
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
        lines: true,
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
      status: 'UNDER_EVALUATION',
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
 * Approve Disposal Request (BE-138)
 * @param {Object} params - { id, approvedBy, approvalNotes, disposalMethod }
 * @returns {Promise<Object>} Approved Disposal Request record
 */
export async function approveDisposalRequest({ id, approvedBy, approvalNotes, disposalMethod }) {
  const record = await getDisposalById(id)

  if (!['DRAFT', 'SUBMITTED', 'UNDER_EVALUATION'].includes(record.status)) {
    throw new ConflictError(
      `Disposal request cannot be approved from current status '${record.status}'.`
    )
  }

  return prisma.disposalRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      ...(approvalNotes && { notes: approvalNotes }),
      ...(disposalMethod && { disposalMethod }),
    },
    include: {
      requestedByUser: { select: { id: true, fullName: true } },
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
 * @param {Object} params - { id, approvedBy, rejectionReason }
 * @returns {Promise<Object>} Rejected Disposal Request record
 */
export async function rejectDisposalRequest({ id, approvedBy, rejectionReason }) {
  if (!rejectionReason) {
    throw new ValidationError('Rejection reason is required')
  }

  const record = await getDisposalById(id)

  if (['EXECUTED', 'CANCELLED'].includes(record.status)) {
    throw new ConflictError(`Disposal request cannot be rejected from status '${record.status}'`)
  }

  return prisma.disposalRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedBy,
      approvedAt: new Date(),
      rejectionReason,
    },
    include: {
      requestedByUser: { select: { id: true, fullName: true } },
      approvedByUser: { select: { id: true, fullName: true } },
    },
  })
}

/**
 * Execute Disposal & Perform Idempotent Transactional Stock Deduction (BE-139)
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

  if (disposal.status === 'EXECUTED') {
    throw new ConflictError('Disposal request has already been executed.')
  }

  if (disposal.status !== 'APPROVED') {
    throw new ConflictError(
      `Disposal request cannot be executed from status '${disposal.status}'. It must be in 'APPROVED' status.`
    )
  }

  if (!Array.isArray(disposal.lines) || disposal.lines.length === 0) {
    throw new ValidationError('Disposal request has no line items to execute')
  }

  return prisma.$transaction(async (tx) => {
    for (const line of disposal.lines) {
      const stockCard = await tx.stockCard.findUnique({
        where: {
          uq_stock_card_item_store: {
            itemId: line.itemId,
            storeId: disposal.storeId,
          },
        },
      })

      if (!stockCard || stockCard.availableQty < line.quantity) {
        throw new ConflictError(
          `Insufficient stock for item '${line.item?.name || line.itemId}'. Available: ${stockCard?.availableQty || 0}`
        )
      }

      let remainingToDeduct = line.quantity
      const batches = await tx.stockBatch.findMany({
        where: { stockCardId: stockCard.id, remainingQty: { gt: 0 } },
        orderBy: { receivedAt: 'asc' }
      })

      let calculatedTotalCost = 0

      for (const batch of batches) {
        if (remainingToDeduct <= 0) break
        const deductQty = Math.min(batch.remainingQty, remainingToDeduct)
        
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: { remainingQty: { decrement: deductQty } }
        })
        
        calculatedTotalCost += deductQty * Number(batch.unitCost)
        remainingToDeduct -= deductQty
      }

      const calculatedUnitCost = calculatedTotalCost / line.quantity

      await tx.stockCard.update({
        where: { id: stockCard.id },
        data: {
          quantity: stockCard.quantity - line.quantity,
          availableQty: stockCard.availableQty - line.quantity,
          lastMovementAt: new Date(),
        },
      })

      await tx.stockCardTransaction.create({
        data: {
          stockCardId: stockCard.id,
          transactionType: 'DISPOSAL',
          quantity: -line.quantity,
          referenceType: 'DISPOSAL_REQUEST',
          referenceId: disposal.id,
          referenceNumber: disposal.disposalNumber,
          notes: executionNotes || `Disposal execution for request ${disposal.disposalNumber}`,
          createdBy: executedBy || disposal.requestedBy,
        },
      })

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
          await tx.binCard.update({
            where: { id: binCard.id },
            data: {
              quantity: Math.max(0, binCard.quantity - line.quantity),
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
              referenceNumber: disposal.disposalNumber,
              notes: executionNotes || `Disposal execution for ${disposal.disposalNumber}`,
              createdBy: executedBy || disposal.requestedBy,
            },
          })
        }
      }

      await tx.disposalRequestLine.update({
        where: { id: line.id },
        data: { 
          status: 'EXECUTED',
          totalCost: typeof calculatedTotalCost !== 'undefined' ? calculatedTotalCost : undefined,
          unitCost: typeof calculatedUnitCost !== 'undefined' ? calculatedUnitCost : undefined
        },
      })
    }

    return tx.disposalRequest.update({
      where: { id },
      data: {
        status: 'EXECUTED',
        executedBy: executedBy || null,
        executedAt: new Date(),
        notes: executionNotes || null,
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
        requestedByUser: { select: { id: true, fullName: true, email: true } },
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
  })
}

/**
 * Get Disposal Audit Trail (BE-140)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getDisposalAuditHistory(id) {
  const disposal = await getDisposalById(id)

  const transactions = await prisma.stockCardTransaction.findMany({
    where: {
      OR: [
        { referenceId: disposal.id },
        { referenceNumber: disposal.disposalNumber },
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
      actor: disposal.requestedByUser
        ? { id: disposal.requestedByUser.id, fullName: disposal.requestedByUser.fullName }
        : null,
      details: `Disposal request ${disposal.disposalNumber} created. Method: ${disposal.disposalMethod}. Reason: ${disposal.reason}`,
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
      details: `Disposal request approved.`,
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
      eventType: 'DISPOSAL_EXECUTED',
      status: 'EXECUTED',
      timestamp: disposal.executedAt || disposal.updatedAt,
      actor: disposal.executedByUser
        ? { id: disposal.executedByUser.id, fullName: disposal.executedByUser.fullName }
        : null,
      details: `Disposal executed. Stock deducted for ${disposal.lines?.length || 0} line item(s).`,
    })
  }

  return {
    summary: {
      disposalId: disposal.id,
      disposalNumber: disposal.disposalNumber,
      currentStatus: disposal.status,
      disposalMethod: disposal.disposalMethod,
    },
    events,
    transactions,
    lines: disposal.lines,
  }
}
