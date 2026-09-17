/**
 * Central Stock Transfer Request Service & Workflow Engine
 * Tasks: BE-121, BE-122, BE-123, BE-126 (Implement Transfer Execution Posting)
 * SRS Traceability: Section 8 (Stock Transfer Module), SRS BR-15, Clarification Register C-10
 * BE-150: Notification events integrated — all calls are fire-and-forget.
 */
import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../utils/errors.js'
import {
  notifyApprovalPending,
  notifyStatusChange,
} from '../notifications/notification-events.service.js'

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
  sourceUserId,
  destinationUserId,
  requestedBy,
  userRoles = [],
  notes,
  lines,
}) {
  const isOfficer = userRoles.some(r => ['ADMIN', 'SUPER_ADMIN', 'PAO'].includes(r))
  const isStorekeeper = userRoles.includes('STOREKEEPER') && !isOfficer
  const isDeptHead = userRoles.includes('DEPARTMENT_HEAD') && !isOfficer
  const isRequesterOnly = !isOfficer && !isDeptHead && !isStorekeeper

  const validTransferTypes = [
    'STORE_TO_STORE',
    'DEPARTMENT_TO_DEPARTMENT',
    'WAREHOUSE_TO_STORE',
    'BIN_TO_BIN',
    'STORE_TO_DEPT',
    'DEPT_TO_STORE',
    'USER_TO_USER',
  ]
  if (!validTransferTypes.includes(transferType)) {
    throw new ValidationError(`Invalid transfer type '${transferType}'. Allowed: ${validTransferTypes.join(', ')}`)
  }

  // Storekeepers only manage store inventory movements
  if (isStorekeeper && transferType === 'USER_TO_USER') {
    throw new ForbiddenError('Storekeepers can only initiate Store-to-Store inventory transfers (Directive 1095/2017 Article 19)')
  }

  // Regular staff/custodians can only initiate user-to-user handovers for their own assigned assets
  if (isRequesterOnly) {
    if (transferType !== 'USER_TO_USER') {
      throw new ForbiddenError('Employees can only initiate User-to-User property handovers')
    }
    if (sourceUserId && sourceUserId !== requestedBy) {
      throw new ForbiddenError('Employees may only initiate transfers for equipment currently assigned to their own custody')
    }
  }

  if (!requestedBy) {
    throw new ValidationError('requestedBy user ID is required')
  }

  if (transferType === 'USER_TO_USER') {
    if (!sourceUserId || !destinationUserId) {
      throw new ValidationError('Source user ID and destination user ID are required for user-to-user transfer')
    }
    if (sourceUserId === destinationUserId) {
      throw new ValidationError('Source user and destination user must be distinct')
    }

    const [sourceUser, destinationUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: sourceUserId } }),
      prisma.user.findUnique({ where: { id: destinationUserId } }),
    ])
    if (!sourceUser || sourceUser.status !== 'ACTIVE') {
      throw new ValidationError('Source user is inactive or does not exist')
    }
    if (!destinationUser || destinationUser.status !== 'ACTIVE') {
      throw new ValidationError('Destination user is inactive or does not exist')
    }
  } else {
    if (!sourceStoreId || !destinationStoreId) {
      throw new ValidationError('Source store ID and destination store ID are required')
    }
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('Transfer request must contain at least one item line')
  }

  const processedLines = []
  for (const line of lines) {
    let itemId = line.itemId
    let assetId = line.assetId || null

    if (transferType === 'USER_TO_USER') {
      if (assetId) {
        const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } })
        if (!asset) {
          throw new NotFoundError(`Fixed asset with ID '${assetId}' not found`)
        }
        if (!asset.custodianId) {
          throw new ValidationError(`Fixed asset '${asset.assetTag || asset.id}' has no assigned custodian and cannot be transferred`)
        }
        if (asset.custodianId !== sourceUserId) {
          throw new ValidationError(`Fixed asset '${asset.assetTag || asset.id}' is not currently assigned to the source user`)
        }
        if (asset.status === 'DISPOSED' || asset.status === 'RETIRED') {
          throw new ValidationError(`Cannot transfer asset '${asset.assetTag || asset.id}' with status '${asset.status}'`)
        }
        if (!itemId) {
          itemId = asset.itemId
        }
      }
    }

    if (!itemId) {
      throw new ValidationError('Each transfer line requires a valid itemId or assetId')
    }

    const qty = line.quantityRequested || line.quantity || 1
    if (qty <= 0) {
      throw new ValidationError('Quantity must be greater than zero')
    }

    processedLines.push({
      itemId,
      assetId,
      quantityRequested: qty,
      quantityTransferred: qty,
      remarks: line.remarks || null,
    })
  }

  const transferNumber = await generateTransferNumber()

  // Choice A Two-Tier Approval Status determination:
  // If an employee/custodian initiates -> PENDING_DEPT_APPROVAL
  // If Department Head or Storekeeper or PAO initiates -> PENDING_PAO_APPROVAL
  let initialStatus = 'PENDING_PAO_APPROVAL'
  let deptApprovedBy = null
  let deptApprovedAt = null

  if (transferType === 'USER_TO_USER') {
    if (isRequesterOnly) {
      initialStatus = 'PENDING_DEPT_APPROVAL'
    } else if (isDeptHead) {
      initialStatus = 'PENDING_PAO_APPROVAL'
      deptApprovedBy = requestedBy
      deptApprovedAt = new Date()
    }
  }

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.create({
      data: {
        transferNumber,
        transferType,
        status: initialStatus,
        sourceStoreId: transferType === 'USER_TO_USER' ? null : sourceStoreId,
        destinationStoreId: transferType === 'USER_TO_USER' ? null : destinationStoreId,
        sourceLocationId: sourceLocationId || null,
        destinationLocationId: destinationLocationId || null,
        sourceUserId: transferType === 'USER_TO_USER' ? sourceUserId : null,
        destinationUserId: transferType === 'USER_TO_USER' ? destinationUserId : null,
        requestedBy,
        deptApprovedBy,
        deptApprovedAt,
        notes: notes || null,
        lines: {
          create: processedLines,
        },
      },
      include: {
        sourceStore: { select: { id: true, name: true, code: true } },
        destinationStore: { select: { id: true, name: true, code: true } },
        sourceUser: { select: { id: true, fullName: true, email: true } },
        destinationUser: { select: { id: true, fullName: true, email: true } },
        requestedByUser: { select: { id: true, fullName: true, email: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, code: true } },
            asset: { select: { id: true, assetTag: true, serialNumber: true, status: true, custodianId: true } },
          },
        },
      },
    })

    // Notify approver — fire-and-forget
    notifyApprovalPending({
      entityType: 'TRANSFER',
      entityId: transfer.id,
      entityNumber: transfer.transferNumber,
      submitterId: requestedBy,
    }).catch(() => {})

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
      sourceUser: { select: { id: true, fullName: true, email: true } },
      destinationUser: { select: { id: true, fullName: true, email: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          asset: { select: { id: true, assetTag: true, serialNumber: true, status: true, custodianId: true } },
        },
      },
    },
  })

  if (!transfer) {
    throw new NotFoundError(`Transfer request with ID '${id}' not found`)
  }

  return transfer
}

/**
 * List Transfer requests with filters and pagination
 * @param {Object} [filters={}] - { status, transferType, sourceStoreId, destinationStoreId, sourceUserId, destinationUserId, page, limit }
 * @returns {Promise<Object>} { transfers, total, page, totalPages }
 */
export async function listTransfers(filters = {}) {
  const { status, transferType, sourceStoreId, destinationStoreId, sourceUserId, destinationUserId, userInvolvedId, isDeptHead, isStorekeeperOnly, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(transferType && { transferType }),
    ...(isStorekeeperOnly && {
      transferType: { not: 'USER_TO_USER' }
    }),
    ...(sourceStoreId && { sourceStoreId }),
    ...(destinationStoreId && { destinationStoreId }),
    ...(sourceUserId && { sourceUserId }),
    ...(destinationUserId && { destinationUserId }),
    ...(userInvolvedId && {
      OR: [
        { sourceUserId: userInvolvedId },
        { destinationUserId: userInvolvedId },
        { requestedBy: userInvolvedId },
        ...(isDeptHead ? [{ status: 'PENDING_DEPT_APPROVAL' }] : []),
      ],
    }),
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
        sourceUser: { select: { id: true, fullName: true, email: true } },
        destinationUser: { select: { id: true, fullName: true, email: true } },
        requestedByUser: { select: { id: true, fullName: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, code: true } },
            asset: { select: { id: true, assetTag: true, serialNumber: true, status: true } },
          },
        },
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
 * Approve or Reject Stock Transfer Request (Choice A Two-Tier Approval Engine)
 * @param {Object} params - { id, approverId, userRoles, notes, isApproved }
 * @returns {Promise<Object>} Approved or Rejected Transfer record
 */
export async function approveTransfer({ id, approverId, userRoles = [], notes, isApproved = true }) {
  const transfer = await getTransferById(id)

  const isDeptHead = userRoles.includes('DEPARTMENT_HEAD')
  const isPao = userRoles.some(r => ['PAO', 'ADMIN', 'SUPER_ADMIN'].includes(r))

  if (approverId && transfer.requestedBy === approverId) {
    throw new ValidationError('A transfer request cannot be approved by the user who created it (Segregation of Duties)')
  }

  // Tier 1: Department Head Approval
  if (transfer.status === 'PENDING_DEPT_APPROVAL') {
    if (!isDeptHead && !isPao) {
      throw new ForbiddenError('Only the Department Head can approve departmental transfer requests')
    }
    const targetStatus = isApproved ? 'PENDING_PAO_APPROVAL' : 'REJECTED'
    const updated = await prisma.transferRequest.update({
      where: { id },
      data: {
        status: targetStatus,
        deptApprovedBy: approverId,
        deptApprovedAt: new Date(),
        ...(notes && { notes }),
      },
      include: { lines: true },
    })

    notifyStatusChange({
      userId: transfer.requestedBy,
      entityType: 'TRANSFER',
      entityId: transfer.id,
      entityNumber: transfer.transferNumber,
      oldStatus: 'PENDING_DEPT_APPROVAL',
      newStatus: targetStatus,
    }).catch(() => {})

    return updated
  }

  // Tier 2: PAO Approval
  if (['PENDING_PAO_APPROVAL', 'PENDING_APPROVAL', 'SUBMITTED', 'DRAFT'].includes(transfer.status)) {
    if (!isPao) {
      throw new ForbiddenError('Only the Property Administration Officer (PAO) can grant institutional approval for transfers')
    }
    const targetStatus = isApproved ? 'APPROVED' : 'REJECTED'
    const updated = await prisma.transferRequest.update({
      where: { id },
      data: {
        status: targetStatus,
        approvedBy: approverId,
        approvedAt: new Date(),
        ...(notes && { notes }),
      },
      include: { lines: true },
    })

    notifyStatusChange({
      userId: transfer.requestedBy,
      entityType: 'TRANSFER',
      entityId: transfer.id,
      entityNumber: transfer.transferNumber,
      oldStatus: transfer.status,
      newStatus: targetStatus,
    }).catch(() => {})

    if (transfer.transferType === 'USER_TO_USER' && targetStatus === 'APPROVED' && transfer.destinationUserId) {
      notifyStatusChange({
        userId: transfer.destinationUserId,
        entityType: 'TRANSFER',
        entityId: transfer.id,
        entityNumber: transfer.transferNumber,
        oldStatus: 'PENDING_PAO_APPROVAL',
        newStatus: 'APPROVED_AWAITING_ACKNOWLEDGMENT',
      }).catch(() => {})
    }

    return updated
  }

  throw new ConflictError(`Transfer request cannot be approved from current status '${transfer.status}'`)
}

/**
 * Dispatch Stock Transfer Request (Status -> IN_TRANSIT)
 * @param {Object} params - { id }
 * @returns {Promise<Object>} Dispatched Transfer record
 */
export async function dispatchTransfer({ id, userRoles = [] }) {
  const transfer = await getTransferById(id)

  const isStorekeeper = !userRoles.length || userRoles.some(r => ['STOREKEEPER', 'ADMIN', 'SUPER_ADMIN'].includes(r))
  if (!isStorekeeper) {
    throw new ForbiddenError('Only warehouse Storekeepers (or Admins) are authorized to physically dispatch store transfers')
  }

  if (transfer.transferType === 'USER_TO_USER') {
    throw new ValidationError('Dispatch action is only applicable to store-to-store transfers. User-to-user transfers require recipient physical acknowledgment.')
  }

  if (transfer.status !== 'APPROVED') {
    throw new ConflictError(`Transfer request cannot be dispatched from current status '${transfer.status}'`)
  }

  const updated = await prisma.transferRequest.update({
    where: { id },
    data: { status: 'IN_TRANSIT' },
    include: { lines: true },
  })

  // BE-150: Notify STOREKEEPER role of dispatch
  notifyStatusChange({
    userId: transfer.requestedBy,
    entityType: 'TRANSFER',
    entityId: transfer.id,
    entityNumber: transfer.transferNumber,
    oldStatus: 'APPROVED',
    newStatus: 'IN_TRANSIT',
  }).catch(() => {})

  return updated
}

/**
 * Acknowledge receipt of a User-to-User transfer (Directive 1095/2017 Article 19)
 * Transferee (destination user) acknowledges receipt of the transferred property.
 * @param {Object} params - { id, userId, userRoles, notes }
 * @returns {Promise<Object>} Updated transfer record
 */
export async function acknowledgeTransfer({ id, userId, userRoles = [], notes }) {
  const transfer = await getTransferById(id)

  if (transfer.transferType !== 'USER_TO_USER') {
    throw new ValidationError('Acknowledgment is only applicable to user-to-user transfers (Federal Directive No. 1095/2017 Article 19)')
  }

  if (transfer.status !== 'APPROVED') {
    throw new ConflictError(`Transfer request cannot be acknowledged from status '${transfer.status}'. It must be approved by the PAO first.`)
  }

  if (transfer.acknowledgedAt) {
    throw new ConflictError('Transfer receipt has already been acknowledged')
  }

  const isAdmin = Array.isArray(userRoles) && userRoles.includes('ADMIN')
  if (userId !== transfer.destinationUserId && !isAdmin) {
    throw new ForbiddenError('Only the receiving employee (transferee) may acknowledge receipt of the transferred property (Federal Property Administration Directive No. 1095/2017 Article 19)')
  }

  const updated = await prisma.transferRequest.update({
    where: { id },
    data: {
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      ...(notes ? { notes: transfer.notes ? `${transfer.notes}\n[Acknowledged]: ${notes}` : `[Acknowledged]: ${notes}` } : {}),
    },
    include: {
      sourceStore: { select: { id: true, name: true, code: true } },
      destinationStore: { select: { id: true, name: true, code: true } },
      sourceUser: { select: { id: true, fullName: true, email: true } },
      destinationUser: { select: { id: true, fullName: true, email: true } },
      requestedByUser: { select: { id: true, fullName: true, email: true } },
      approvedByUser: { select: { id: true, fullName: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          asset: { select: { id: true, assetTag: true, serialNumber: true, status: true, custodianId: true } },
        },
      },
    },
  })

  return updated
}

/**
 * Complete Stock Transfer Request (Status -> COMPLETED)
 * For USER_TO_USER transfers (Article 19):
 *  - Requires transferee physical acknowledgment before completion
 *  - Automatically reassigns asset custody to destination user
 *  - Bypasses warehouse stock card deduction (zero double-posting)
 *  - Records an audit trail entry
 * @param {Object} params - { id, executionUserId }
 * @returns {Promise<Object>} Completed Transfer record
 */
export async function completeTransfer({ id, executionUserId, userRoles = [] }) {
  const transfer = await getTransferById(id)

  if (transfer.transferType === 'USER_TO_USER') {
    if (transfer.status !== 'APPROVED') {
      throw new ConflictError(`User-to-user transfer cannot be completed from current status '${transfer.status}'`)
    }

    if (!transfer.acknowledgedAt) {
      throw new ConflictError('Cannot complete user-to-user property transfer before receipt is acknowledged by the receiving employee (Directive No. 1095/2017 Article 19 § 2)')
    }

    return prisma.$transaction(async (tx) => {
      // Reassign asset custody to destinationUserId
      for (const line of transfer.lines) {
        if (line.assetId) {
          await tx.fixedAsset.update({
            where: { id: line.assetId },
            data: {
              custodianId: transfer.destinationUserId,
              status: 'IN_USE',
            },
          })
        }
      }

      // Record Audit Event for Article 19 User-to-User Transfer
      await tx.auditEvent.create({
        data: {
          eventType: 'PROPERTY_USER_TRANSFER_EXECUTED',
          userId: executionUserId || transfer.destinationUserId || transfer.requestedBy,
          details: JSON.stringify({
            transferNumber: transfer.transferNumber,
            sourceUserId: transfer.sourceUserId,
            destinationUserId: transfer.destinationUserId,
            lines: transfer.lines.map((l) => ({
              itemId: l.itemId,
              assetId: l.assetId,
              assetTag: l.asset?.assetTag,
            })),
            legalReference: 'Directive No. 1095/2017 Article 19',
          }),
        },
      }).catch(() => {})

      // Update transfer status to COMPLETED
      const updatedTransfer = await tx.transferRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
        },
        include: {
          sourceStore: { select: { id: true, name: true, code: true } },
          destinationStore: { select: { id: true, name: true, code: true } },
          sourceUser: { select: { id: true, fullName: true, email: true } },
          destinationUser: { select: { id: true, fullName: true, email: true } },
          requestedByUser: { select: { id: true, fullName: true, email: true } },
          lines: {
            include: {
              item: { select: { id: true, name: true, code: true } },
              asset: { select: { id: true, assetTag: true, serialNumber: true, status: true, custodianId: true } },
            },
          },
        },
      })

      return updatedTransfer
    })
  }

  // Store-to-store transfer completion
  const isStorekeeper = !userRoles.length || userRoles.some(r => ['STOREKEEPER', 'ADMIN', 'SUPER_ADMIN'].includes(r))
  if (!isStorekeeper) {
    throw new ForbiddenError('Only destination Storekeepers (or Admins) are authorized to receive and complete store transfers')
  }

  if (transfer.status !== 'IN_TRANSIT') {
    throw new ConflictError(`Store transfer cannot be completed from current status '${transfer.status}'. Goods must be dispatched ('IN_TRANSIT') first.`)
  }

  return prisma.transferRequest.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: { lines: true },
  })
}

/**
 * Execute Two-Legged Atomic Stock Transfer Posting (SRS BR-15 & BE-126)
 * Source Store: Decrement stock card (TRANSFER, -qty)
 * Destination Store: Increment stock card (TRANSFER, +qty)
 * Both legs execute inside ONE single atomic database transaction.
 *
 * NOTE: For USER_TO_USER transfers (Article 19), warehouse stock cards are NOT affected.
 * The custody is directly reassigned via completeTransfer.
 * @param {Object} params - { id, executionUserId }
 * @returns {Promise<Object>} Updated Transfer record
 */
export async function executeTransferPosting({ id, executionUserId }) {
  const transfer = await getTransferById(id)

  if (transfer.status === 'COMPLETED') {
    throw new ConflictError('Transfer execution posting has already been completed.')
  }

  if (!['APPROVED', 'IN_TRANSIT'].includes(transfer.status)) {
    throw new ConflictError(`Transfer execution posting cannot be executed for status '${transfer.status}'`)
  }

  if (transfer.transferType === 'USER_TO_USER') {
    return completeTransfer({ id, executionUserId })
  }

  return prisma.$transaction(async (tx) => {
    for (const line of transfer.lines) {
      const qtyTransferred = line.quantityTransferred || line.quantityRequested

      // --- LEG 1: SOURCE STORE DEDUCTION ---
      const sourceCard = await tx.stockCard.findUnique({
        where: {
          uq_stock_card_item_store: {
            itemId: line.itemId,
            storeId: transfer.sourceStoreId,
          },
        },
      })

      if (!sourceCard || sourceCard.availableQty < qtyTransferred) {
        throw new ConflictError(`Insufficient stock in source store for item '${line.itemId}' to complete transfer`)
      }

      const sourceNewQty = sourceCard.quantity - qtyTransferred
      const sourceNewAvailable = sourceCard.availableQty - qtyTransferred

      await tx.stockCard.update({
        where: { id: sourceCard.id },
        data: {
          quantity: sourceNewQty,
          availableQty: sourceNewAvailable,
        },
      })

      await tx.stockCardTransaction.create({
        data: {
          stockCardId: sourceCard.id,
          transactionType: 'TRANSFER',
          quantity: -qtyTransferred,
          balanceAfter: sourceNewQty,
          referenceType: 'STR',
          referenceId: transfer.id,
          referenceNumber: transfer.transferNumber,
          notes: line.remarks || `Transfer OUT for ${transfer.transferNumber}`,
          createdBy: executionUserId || transfer.requestedBy,
        },
      })

      // --- LEG 2: DESTINATION STORE ADDITION ---
      let destCard = await tx.stockCard.findUnique({
        where: {
          uq_stock_card_item_store: {
            itemId: line.itemId,
            storeId: transfer.destinationStoreId,
          },
        },
      })

      if (!destCard) {
        destCard = await tx.stockCard.create({
          data: {
            itemId: line.itemId,
            storeId: transfer.destinationStoreId,
            quantity: 0,
            availableQty: 0,
            reservedQty: 0,
          },
        })
      }

      const destNewQty = destCard.quantity + qtyTransferred
      const destNewAvailable = destCard.availableQty + qtyTransferred

      await tx.stockCard.update({
        where: { id: destCard.id },
        data: {
          quantity: destNewQty,
          availableQty: destNewAvailable,
        },
      })

      await tx.stockCardTransaction.create({
        data: {
          stockCardId: destCard.id,
          transactionType: 'TRANSFER',
          quantity: qtyTransferred,
          balanceAfter: destNewQty,
          referenceType: 'STR',
          referenceId: transfer.id,
          referenceNumber: transfer.transferNumber,
          notes: line.remarks || `Transfer IN for ${transfer.transferNumber}`,
          createdBy: executionUserId || transfer.requestedBy,
        },
      })
    }

    // Update transfer status to COMPLETED
    const updatedTransfer = await tx.transferRequest.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: { lines: true },
    })

    return updatedTransfer
  })
}
