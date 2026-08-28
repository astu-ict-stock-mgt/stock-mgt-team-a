/**
 * Notification Events Service — Domain Event Wiring
 * Task: BE-150
 * SRS Traceability: Section 12.2 (Notifications), FR-43, UC-38
 *
 * Centralized service that domain modules call to emit notification events.
 * Resolves target users by RBAC role code and creates bulk notifications.
 *
 * ALL functions are designed to be called fire-and-forget:
 *   notifyApprovalPending({...}).catch(() => {})
 * so they CANNOT break the primary business workflow.
 *
 * Priority mapping:
 *   HIGH   — approval required, rejection, security events, evaluation required,
 *            property registration required, disposal candidates
 *   MEDIUM — GRN ready, low stock, shelf-life warning, status updates
 *   LOW    — informational system events
 */

import { prisma } from '../../config/database.js'
import { createBulkNotifications, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from './notifications.service.js'
import { createAuditEvent, AUDIT_EVENT_TYPES } from '../audit/audit.service.js'

// ────────────────────────────────────────────────────────────────
// Internal Helpers
// ────────────────────────────────────────────────────────────────

/**
 * Resolve user IDs for a given set of RBAC role codes.
 * Looks up the Role table first by `code`, then queries UserRole.
 * @param {string[]} roleCodes - e.g. ['PAO', 'STOREKEEPER']
 * @returns {Promise<string[]>} unique user IDs
 */
async function getUserIdsByRoles(roleCodes) {
  const roles = await prisma.role.findMany({
    where: { code: { in: roleCodes } },
    select: { id: true },
  })
  const roleIds = roles.map((r) => r.id)
  if (roleIds.length === 0) return []

  const userRoles = await prisma.userRole.findMany({
    where: { roleId: { in: roleIds } },
    select: { userId: true },
  })
  return [...new Set(userRoles.map((ur) => ur.userId))]
}

/**
 * Build notification payloads for a list of user IDs.
 * @param {string[]} userIds
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.type]
 * @param {string} [params.priority]
 * @param {string} [params.referenceId]
 * @param {string} [params.referenceType]
 * @returns {Object[]}
 */
function buildNotifications(userIds, { title, message, type = NOTIFICATION_TYPES.INFO, priority = NOTIFICATION_PRIORITY.MEDIUM, referenceId, referenceType }) {
  return userIds.map((userId) => ({
    userId,
    title,
    message,
    type,
    priority,
    referenceId: referenceId || null,
    referenceType: referenceType || null,
  }))
}

/**
 * Check if an unread notification already exists for userId+type+referenceId.
 * Used to deduplicate system-generated alerts.
 */
async function hasActiveNotification(userId, type, referenceId) {
  if (!referenceId) return false
  const existing = await prisma.notification.findFirst({
    where: { userId, type, referenceId, isRead: false },
    select: { id: true },
  })
  return existing !== null
}

// ────────────────────────────────────────────────────────────────
// A. Approval Pending — Requisition, SIV, Return, Transfer, Disposal
// ────────────────────────────────────────────────────────────────

/**
 * Notify approvers that an entity requires their approval.
 *
 * Recipient matrix:
 *   REQUISITION → DEPARTMENT_HEAD, PAO
 *   SIV         → PAO, STOREKEEPER
 *   RETURN      → TEC, PAO, STOREKEEPER
 *   TRANSFER    → PAO
 *   DISPOSAL    → PAO, TEC
 *
 * @param {Object} params
 * @param {string} params.entityType - 'REQUISITION' | 'SIV' | 'RETURN' | 'TRANSFER' | 'DISPOSAL'
 * @param {string} params.entityId
 * @param {string} params.entityNumber - Human-readable (e.g. REQ-2026-00015)
 * @param {string} [params.submitterId] - User who submitted (excluded from notifications)
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyApprovalPending({ entityType, entityId, entityNumber, submitterId }) {
  const approverRoles = {
    REQUISITION: ['DEPARTMENT_HEAD', 'PAO'],
    SIV: ['PAO', 'STOREKEEPER'],
    RETURN: ['TEC', 'PAO', 'STOREKEEPER'],
    TRANSFER: ['PAO'],
    DISPOSAL: ['PAO', 'TEC'],
  }

  const targetRoles = approverRoles[entityType] || ['PAO']
  let userIds = await getUserIdsByRoles(targetRoles)

  // Do not notify the person who submitted
  if (submitterId) userIds = userIds.filter((uid) => uid !== submitterId)

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `${entityType} Awaiting Approval`,
    message: `${entityType} ${entityNumber || entityId} requires your approval.`,
    type: NOTIFICATION_TYPES.APPROVAL_REQUIRED,
    priority: NOTIFICATION_PRIORITY.HIGH,
    referenceId: entityId,
    referenceType: entityType,
  })

  const result = await createBulkNotifications(notifications)

  // Non-blocking audit
  if (AUDIT_EVENT_TYPES[`${entityType}_SUBMITTED`]) {
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES[`${entityType}_SUBMITTED`],
      userId: submitterId || null,
      details: JSON.stringify({ entityType, entityId, entityNumber }),
    }).catch(() => {})
  }

  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// B. Status Change — Notify the originating user of outcome
// ────────────────────────────────────────────────────────────────

/**
 * Notify a specific user when the status of their request changes.
 * Used for: requisition approved/rejected, transfer approved/rejected, return evaluated.
 *
 * @param {Object} params
 * @param {string} params.userId - Target user to notify
 * @param {string} params.entityType - e.g. 'REQUISITION', 'TRANSFER', 'RETURN'
 * @param {string} params.entityId
 * @param {string} [params.entityNumber]
 * @param {string} params.oldStatus
 * @param {string} params.newStatus
 * @returns {Promise<{created: number}>}
 */
export async function notifyStatusChange({ userId, entityType, entityId, entityNumber, oldStatus, newStatus }) {
  if (!userId) return { created: 0 }

  // Determine priority from new status
  const isRejection = newStatus.includes('REJECTED')
  const isApproval = newStatus.includes('APPROVED') || newStatus === 'COMPLETED'
  const priority = isRejection ? NOTIFICATION_PRIORITY.HIGH
    : isApproval ? NOTIFICATION_PRIORITY.MEDIUM
    : NOTIFICATION_PRIORITY.LOW

  const notifications = buildNotifications([userId], {
    title: `${entityType} ${isRejection ? 'Rejected' : isApproval ? 'Approved' : 'Updated'}`,
    message: `${entityType} ${entityNumber || entityId} status changed from ${oldStatus} to ${newStatus}.`,
    type: isRejection ? NOTIFICATION_TYPES.REJECTED : isApproval ? NOTIFICATION_TYPES.APPROVED : NOTIFICATION_TYPES.STATUS_UPDATE,
    priority,
    referenceId: entityId,
    referenceType: entityType,
  })

  const result = await createBulkNotifications(notifications)
  return { created: result.count }
}

// ────────────────────────────────────────────────────────────────
// C. Goods Receipt — Technical Evaluation Required
// ────────────────────────────────────────────────────────────────

/**
 * Notify TEC (Technical Evaluation Committee) that a goods receipt
 * requires their technical evaluation.
 *
 * @param {Object} params
 * @param {string} params.goodsReceiptId
 * @param {string} params.receiptNumber
 * @param {string} [params.submitterId]
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyGoodsReceiptEvaluationRequired({ goodsReceiptId, receiptNumber, submitterId }) {
  const userIds = await getUserIdsByRoles(['TEC'])
  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Technical Evaluation Required: ${receiptNumber}`,
    message: `Goods receipt ${receiptNumber} requires technical evaluation. Please review and provide your assessment.`,
    type: NOTIFICATION_TYPES.RECEIPT_EVALUATION,
    priority: NOTIFICATION_PRIORITY.HIGH,
    referenceId: goodsReceiptId,
    referenceType: 'GOODS_RECEIPT',
  })

  const result = await createBulkNotifications(notifications)
  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// D. Material Decision — TEC accept/reject outcome
// ────────────────────────────────────────────────────────────────

/**
 * Notify STOREKEEPER and PAO when TEC makes a material decision (accept/reject).
 *
 * @param {Object} params
 * @param {string} params.entityType - 'GOODS_RECEIPT' | 'RETURN'
 * @param {string} params.decision - 'ACCEPTED' | 'REJECTED'
 * @param {string} params.entityId
 * @param {string} params.entityNumber
 * @param {string} [params.deciderId]
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyMaterialDecision({ entityType, decision, entityId, entityNumber, deciderId }) {
  const userIds = await getUserIdsByRoles(['STOREKEEPER', 'PAO'])
  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const isAccepted = decision === 'ACCEPTED'
  const notifications = buildNotifications(userIds, {
    title: `Material ${isAccepted ? 'Accepted' : 'Rejected'}: ${entityNumber || entityId}`,
    message: `${entityType} ${entityNumber || entityId} has been ${decision.toLowerCase()} by the technical evaluation committee.`,
    type: isAccepted ? NOTIFICATION_TYPES.MATERIAL_ACCEPTED : NOTIFICATION_TYPES.MATERIAL_REJECTED,
    priority: isAccepted ? NOTIFICATION_PRIORITY.MEDIUM : NOTIFICATION_PRIORITY.HIGH,
    referenceId: entityId,
    referenceType: entityType,
  })

  const result = await createBulkNotifications(notifications)
  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// E. GRN Created
// ────────────────────────────────────────────────────────────────

/**
 * Notify STOREKEEPER and ACCOUNTANT when a GRN is generated.
 *
 * @param {Object} params
 * @param {string} params.grnId
 * @param {string} params.grnNumber
 * @param {string} [params.creatorId]
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyGRNCreated({ grnId, grnNumber, creatorId }) {
  const userIds = await getUserIdsByRoles(['STOREKEEPER', 'ACCOUNTANT'])
  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `GRN Ready: ${grnNumber}`,
    message: `Goods Receiving Note ${grnNumber} has been generated and is ready for review.`,
    type: NOTIFICATION_TYPES.GRN_READY,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    referenceId: grnId,
    referenceType: 'GRN',
  })

  const result = await createBulkNotifications(notifications)

  if (AUDIT_EVENT_TYPES.GRN_FINALIZED) {
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES.GRN_FINALIZED,
      userId: creatorId || null,
      details: JSON.stringify({ grnId, grnNumber }),
    }).catch(() => {})
  }

  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// F. Low Stock
// ────────────────────────────────────────────────────────────────

/**
 * Notify STOREKEEPER and PAO when stock falls below reorder level.
 * Deduplicated: will not create a new notification if an unread LOW_STOCK
 * notification already exists for this item.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.itemName
 * @param {number} params.currentQty
 * @param {number} params.reorderPoint
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyLowStock({ itemId, itemName, currentQty, reorderPoint }) {
  const allUserIds = await getUserIdsByRoles(['STOREKEEPER', 'PAO'])
  if (allUserIds.length === 0) return { created: 0, usersNotified: 0 }

  // Per-user deduplication
  const existingNotifs = await prisma.notification.findMany({
    where: {
      userId: { in: allUserIds },
      type: NOTIFICATION_TYPES.LOW_STOCK,
      referenceId: itemId,
      isRead: false,
    },
    select: { userId: true },
  })
  const alreadyNotified = new Set(existingNotifs.map((n) => n.userId))
  const userIds = allUserIds.filter((uid) => !alreadyNotified.has(uid))

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Low Stock Alert: ${itemName}`,
    message: `${itemName} stock is at ${currentQty} units, below reorder point of ${reorderPoint}. Reorder recommended.`,
    type: NOTIFICATION_TYPES.LOW_STOCK,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    referenceId: itemId,
    referenceType: 'ITEM',
  })

  const result = await createBulkNotifications(notifications)

  if (AUDIT_EVENT_TYPES.LOW_STOCK_ALERT) {
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES.LOW_STOCK_ALERT,
      userId: null,
      details: JSON.stringify({ itemId, itemName, currentQty, reorderPoint }),
    }).catch(() => {})
  }

  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// G. Shelf-Life Warning
// ────────────────────────────────────────────────────────────────

/**
 * Notify STOREKEEPER and PAO when an item's shelf life is approaching.
 * Deduplicated per item.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.itemName
 * @param {string} [params.batchNumber]
 * @param {number} params.daysUntilExpiry
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyShelfLifeWarning({ itemId, itemName, batchNumber, daysUntilExpiry }) {
  const allUserIds = await getUserIdsByRoles(['STOREKEEPER', 'PAO'])
  if (allUserIds.length === 0) return { created: 0, usersNotified: 0 }

  const existingNotifs = await prisma.notification.findMany({
    where: {
      userId: { in: allUserIds },
      type: NOTIFICATION_TYPES.EXPIRY_WARNING,
      referenceId: itemId,
      isRead: false,
    },
    select: { userId: true },
  })
  const alreadyNotified = new Set(existingNotifs.map((n) => n.userId))
  const userIds = allUserIds.filter((uid) => !alreadyNotified.has(uid))

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Shelf-Life Warning: ${itemName}`,
    message: `${itemName} (batch: ${batchNumber || 'N/A'}) expires in ${daysUntilExpiry} day(s). Consider disposal or expedited use.`,
    type: NOTIFICATION_TYPES.EXPIRY_WARNING,
    priority: daysUntilExpiry <= 7 ? NOTIFICATION_PRIORITY.HIGH : NOTIFICATION_PRIORITY.MEDIUM,
    referenceId: itemId,
    referenceType: 'ITEM',
  })

  const result = await createBulkNotifications(notifications)

  if (AUDIT_EVENT_TYPES.SHELF_LIFE_WARNING) {
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES.SHELF_LIFE_WARNING,
      userId: null,
      details: JSON.stringify({ itemId, itemName, batchNumber, daysUntilExpiry }),
    }).catch(() => {})
  }

  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// H. Disposal Candidate
// ────────────────────────────────────────────────────────────────

/**
 * Notify PAO and TEC when an item is flagged for disposal.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.itemName
 * @param {string} params.reason - e.g. 'EXPIRED', 'DAMAGED', 'OBSOLETE'
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyDisposalCandidate({ itemId, itemName, reason }) {
  const allUserIds = await getUserIdsByRoles(['PAO', 'TEC'])
  if (allUserIds.length === 0) return { created: 0, usersNotified: 0 }

  const existingNotifs = await prisma.notification.findMany({
    where: {
      userId: { in: allUserIds },
      type: NOTIFICATION_TYPES.DISPOSAL_CANDIDATE,
      referenceId: itemId,
      isRead: false,
    },
    select: { userId: true },
  })
  const alreadyNotified = new Set(existingNotifs.map((n) => n.userId))
  const userIds = allUserIds.filter((uid) => !alreadyNotified.has(uid))

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Disposal Candidate: ${itemName}`,
    message: `${itemName} has been flagged for disposal. Reason: ${reason}. Review required.`,
    type: NOTIFICATION_TYPES.DISPOSAL_CANDIDATE,
    priority: NOTIFICATION_PRIORITY.HIGH,
    referenceId: itemId,
    referenceType: 'ITEM',
  })

  const result = await createBulkNotifications(notifications)

  if (AUDIT_EVENT_TYPES.DISPOSAL_CANDIDATE_FLAGGED) {
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES.DISPOSAL_CANDIDATE_FLAGGED,
      userId: null,
      details: JSON.stringify({ itemId, itemName, reason }),
    }).catch(() => {})
  }

  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// I. Property Registration Required
// ────────────────────────────────────────────────────────────────

/**
 * Notify PROPERTY_REGISTRATION_OFFICER when an accepted material
 * requires fixed-asset / property registration.
 *
 * @param {Object} params
 * @param {string} params.entityId - GRN ID or Item ID
 * @param {string} params.entityNumber - e.g. GRN-2026-00001
 * @param {string} params.entityType - 'GRN' | 'ITEM'
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifyPropertyRegistrationRequired({ entityId, entityNumber, entityType = 'GRN' }) {
  const userIds = await getUserIdsByRoles(['PROPERTY_REGISTRATION_OFFICER'])
  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Property Registration Required: ${entityNumber}`,
    message: `Accepted material from ${entityType} ${entityNumber} requires property registration. Please process the registration.`,
    type: NOTIFICATION_TYPES.PROPERTY_REGISTRATION_REQUIRED,
    priority: NOTIFICATION_PRIORITY.HIGH,
    referenceId: entityId,
    referenceType: entityType,
  })

  const result = await createBulkNotifications(notifications)
  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// J. Security Event
// ────────────────────────────────────────────────────────────────

/**
 * Notify SECURITY_OFFICER and ADMIN of a security-sensitive stock/gate event.
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.referenceId]
 * @param {string} [params.referenceType]
 * @returns {Promise<{created: number, usersNotified: number}>}
 */
export async function notifySecurityEvent({ title, message, referenceId, referenceType }) {
  const userIds = await getUserIdsByRoles(['SECURITY_OFFICER', 'ADMIN'])
  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title,
    message,
    type: NOTIFICATION_TYPES.SECURITY_EVENT,
    priority: NOTIFICATION_PRIORITY.HIGH,
    referenceId,
    referenceType,
  })

  const result = await createBulkNotifications(notifications)
  return { created: result.count, usersNotified: userIds.length }
}
