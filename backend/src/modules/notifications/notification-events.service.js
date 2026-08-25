/**
 * Notification Events Service — Domain Event Wiring
 * Task: BE-150
 * SRS Traceability: Section 12.2 (Notifications), FR-40
 *
 * Centralized service that domain modules call to emit notification events.
 * Resolves target users by RBAC role and creates bulk notifications.
 */

import { prisma } from '../../config/database.js'
import { createBulkNotifications } from './notifications.service.js'
import { createAuditEvent, AUDIT_EVENT_TYPES } from '../audit/audit.service.js'

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/**
 * Resolve user IDs for a given set of RBAC role codes.
 * Looks up the Role table first to get the DB role IDs, then queries UserRole.
 * @param {string[]} roleCodes - e.g. ['PAO', 'STOREKEEPER']
 * @returns {Promise<string[]>} unique user IDs
 */
async function getUserIdsByRoles(roleCodes) {
  // Roles in the database have a `code` field that matches RBAC codes
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
 * @param {Object} params - { title, message, type, referenceId, referenceType }
 * @returns {Object[]}
 */
function buildNotifications(userIds, { title, message, type = 'INFO', referenceId, referenceType }) {
  return userIds.map((userId) => ({
    userId,
    title,
    message,
    type,
    referenceId: referenceId || null,
    referenceType: referenceType || null,
  }))
}

// ────────────────────────────────────────────────────────────────
// Approval Pending Notifications
// ────────────────────────────────────────────────────────────────

/**
 * Notify approvers that an entity is pending approval.
 * @param {Object} params
 * @param {string} params.entityType - 'REQUISITION' | 'SIV' | 'RETURN' | 'TRANSFER' | 'DISPOSAL'
 * @param {string} params.entityId - UUID of the entity
 * @param {string} params.entityNumber - Human-readable number (e.g. REQ-2026-001)
 * @param {string} [params.submitterId] - User who submitted (for audit)
 * @returns {Promise<Object>} { created, usersNotified }
 */
export async function notifyApprovalPending({ entityType, entityId, entityNumber, submitterId }) {
  // Map entity types to the approver roles
  const approverRoles = {
    REQUISITION: ['DEPARTMENT_HEAD', 'PAO'],
    SIV: ['PAO', 'STOREKEEPER'],
    RETURN: ['TEC', 'PAO', 'STOREKEEPER'],
    TRANSFER: ['PAO'],
    DISPOSAL: ['PAO', 'TEC'],
  }

  const targetRoles = approverRoles[entityType] || ['PAO']
  const userIds = await getUserIdsByRoles(targetRoles)

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `${entityType} Pending Approval`,
    message: `${entityType} ${entityNumber || entityId} requires your approval.`,
    type: 'APPROVAL_REQUIRED',
    referenceId: entityId,
    referenceType: entityType,
  })

  const result = await createBulkNotifications(notifications)

  // Also log an audit event
  if (AUDIT_EVENT_TYPES[`${entityType}_SUBMITTED`]) {
    await createAuditEvent({
      eventType: AUDIT_EVENT_TYPES[`${entityType}_SUBMITTED`],
      userId: submitterId || null,
      details: JSON.stringify({ entityType, entityId, entityNumber }),
    }).catch(() => {}) // Non-blocking audit
  }

  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// Material Decision Notification (TEC accept/reject)
// ────────────────────────────────────────────────────────────────

/**
 * Notify relevant users when a material decision is made by TEC.
 * @param {Object} params
 * @param {string} params.entityType - 'GOODS_RECEIPT' | 'RETURN'
 * @param {string} params.decision - 'ACCEPTED' | 'REJECTED'
 * @param {string} params.entityId
 * @param {string} [params.deciderId] - User who made the decision (for audit)
 * @returns {Promise<Object>}
 */
export async function notifyMaterialDecision({ entityType, decision, entityId, deciderId }) {
  const userIds = await getUserIdsByRoles(['STOREKEEPER', 'PAO'])

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Material ${decision}: ${entityType}`,
    message: `${entityType} ${entityId} has been ${decision.toLowerCase()} by the evaluation committee.`,
    type: decision === 'ACCEPTED' ? 'INFO' : 'WARNING',
    referenceId: entityId,
    referenceType: entityType,
  })

  const result = await createBulkNotifications(notifications)
  return { created: result.count, usersNotified: userIds.length }
}

// ────────────────────────────────────────────────────────────────
// GRN Created Notification
// ────────────────────────────────────────────────────────────────

/**
 * Notify store staff when a GRN is generated.
 * @param {Object} params
 * @param {string} params.grnId
 * @param {string} params.grnNumber
 * @param {string} [params.creatorId]
 * @returns {Promise<Object>}
 */
export async function notifyGRNCreated({ grnId, grnNumber, creatorId }) {
  const userIds = await getUserIdsByRoles(['STOREKEEPER', 'ACCOUNTANT'])

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `GRN Generated: ${grnNumber}`,
    message: `Goods Receiving Note ${grnNumber} has been generated and is ready for review.`,
    type: 'INFO',
    referenceId: grnId,
    referenceType: 'GRN',
  })

  const result = await createBulkNotifications(notifications)

  // Audit event
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
// Low Stock Notification
// ────────────────────────────────────────────────────────────────

/**
 * Notify storekeeper/PAO when stock falls below reorder level.
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.itemName
 * @param {number} params.currentQty
 * @param {number} params.reorderPoint
 * @returns {Promise<Object>}
 */
export async function notifyLowStock({ itemId, itemName, currentQty, reorderPoint }) {
  const userIds = await getUserIdsByRoles(['STOREKEEPER', 'PAO'])

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Low Stock Alert: ${itemName}`,
    message: `${itemName} stock is at ${currentQty} units, below reorder point of ${reorderPoint}. Reorder recommended.`,
    type: 'LOW_STOCK',
    referenceId: itemId,
    referenceType: 'ITEM',
  })

  const result = await createBulkNotifications(notifications)

  // Audit event
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
// Shelf-Life Warning Notification
// ────────────────────────────────────────────────────────────────

/**
 * Notify when an item's shelf life is approaching expiry.
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.itemName
 * @param {string} params.batchNumber
 * @param {number} params.daysUntilExpiry
 * @returns {Promise<Object>}
 */
export async function notifyShelfLifeWarning({ itemId, itemName, batchNumber, daysUntilExpiry }) {
  const userIds = await getUserIdsByRoles(['STOREKEEPER', 'PAO'])

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Shelf-Life Warning: ${itemName}`,
    message: `${itemName} (batch: ${batchNumber || 'N/A'}) expires in ${daysUntilExpiry} day(s). Consider disposal or expedited use.`,
    type: 'EXPIRY_WARNING',
    referenceId: itemId,
    referenceType: 'ITEM',
  })

  const result = await createBulkNotifications(notifications)

  // Audit event
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
// Disposal Candidate Notification
// ────────────────────────────────────────────────────────────────

/**
 * Notify PAO/committee when an item is flagged for disposal.
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.itemName
 * @param {string} params.reason - e.g. 'EXPIRED', 'DAMAGED', 'OBSOLETE'
 * @returns {Promise<Object>}
 */
export async function notifyDisposalCandidate({ itemId, itemName, reason }) {
  const userIds = await getUserIdsByRoles(['PAO', 'TEC'])

  if (userIds.length === 0) return { created: 0, usersNotified: 0 }

  const notifications = buildNotifications(userIds, {
    title: `Disposal Candidate: ${itemName}`,
    message: `${itemName} has been flagged for disposal. Reason: ${reason}. Review required.`,
    type: 'DISPOSAL_CANDIDATE',
    referenceId: itemId,
    referenceType: 'ITEM',
  })

  const result = await createBulkNotifications(notifications)

  // Audit event
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
// Status Change Notification (generic)
// ────────────────────────────────────────────────────────────────

/**
 * Notify a specific user when the status of their request changes.
 * @param {Object} params
 * @param {string} params.userId - Target user to notify
 * @param {string} params.entityType - e.g. 'REQUISITION'
 * @param {string} params.entityId
 * @param {string} params.entityNumber
 * @param {string} params.oldStatus
 * @param {string} params.newStatus
 * @returns {Promise<Object>}
 */
export async function notifyStatusChange({ userId, entityType, entityId, entityNumber, oldStatus, newStatus }) {
  if (!userId) return { created: 0 }

  const notifications = buildNotifications([userId], {
    title: `${entityType} Status Updated`,
    message: `${entityType} ${entityNumber || entityId} status changed from ${oldStatus} to ${newStatus}.`,
    type: 'STATUS_UPDATE',
    referenceId: entityId,
    referenceType: entityType,
  })

  const result = await createBulkNotifications(notifications)
  return { created: result.count }
}
