/**
 * Notifications Service
 * Task: BE-150
 * SRS Traceability: Section 6.6 (Notifications), FR-43, UC-38
 *
 * Changes in this revision:
 * - Added `priority` field (LOW | MEDIUM | HIGH) to all create paths
 * - Fixed generateExpiryNotifications() — now uses ShelfLifeRecord (correct model)
 *   instead of non-existent StockCard.expiryDate
 * - Fixed generateLowStockNotifications() — uses Item.status = ACTIVE instead
 *   of non-existent Item.isActive field
 * - Added deduplication: prevents duplicate LOW_STOCK / EXPIRY_WARNING notifications
 *   while an unread notification for the same entity already exists
 * - Added getUnreadCount() function for the new GET /unread-count endpoint
 */

import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../utils/errors.js'

// ─────────────────────────────────────────────────────────────────
// Priority constants
// ─────────────────────────────────────────────────────────────────
export const NOTIFICATION_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
}

// ─────────────────────────────────────────────────────────────────
// Notification type constants (centralised)
// ─────────────────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  // Approval workflow
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  STATUS_UPDATE: 'STATUS_UPDATE',

  // Receiving / evaluation
  RECEIPT_EVALUATION: 'RECEIPT_EVALUATION',
  MATERIAL_ACCEPTED: 'MATERIAL_ACCEPTED',
  MATERIAL_REJECTED: 'MATERIAL_REJECTED',
  GRN_READY: 'GRN_READY',

  // Stock alerts
  LOW_STOCK: 'LOW_STOCK',
  EXPIRY_WARNING: 'EXPIRY_WARNING',
  DISPOSAL_CANDIDATE: 'DISPOSAL_CANDIDATE',

  // Asset / property
  PROPERTY_REGISTRATION_REQUIRED: 'PROPERTY_REGISTRATION_REQUIRED',

  // Security / system
  SECURITY_EVENT: 'SECURITY_EVENT',
  INFO: 'INFO',
  WARNING: 'WARNING',
}

/**
 * Create a single notification for one user.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.type]
 * @param {string} [params.priority]
 * @param {string} [params.referenceId]
 * @param {string} [params.referenceType]
 * @returns {Promise<Object>}
 */
export async function createNotification({
  userId,
  title,
  message,
  type = NOTIFICATION_TYPES.INFO,
  priority = NOTIFICATION_PRIORITY.MEDIUM,
  referenceId,
  referenceType,
}) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      priority,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
    },
  })
}

/**
 * Create multiple notifications at once (bulk insert).
 * @param {Array<{userId, title, message, type?, priority?, referenceId?, referenceType?}>} notifications
 * @returns {Promise<{count: number}>}
 */
export async function createBulkNotifications(notifications) {
  return prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type || NOTIFICATION_TYPES.INFO,
      priority: n.priority || NOTIFICATION_PRIORITY.MEDIUM,
      referenceId: n.referenceId || null,
      referenceType: n.referenceType || null,
    })),
  })
}

/**
 * Get paginated notifications for a user.
 * @param {string} userId
 * @param {Object} [params]
 * @param {boolean} [params.unreadOnly]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<Object>}
 */
export async function getUserNotifications(userId, { unreadOnly = false, page = 1, limit = 20 } = {}) {
  const where = {
    userId,
    ...(unreadOnly && { isRead: false }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = Math.min(parseInt(String(limit), 10) || 20, 100)
  const skip = (pageNum - 1) * limitNum

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  return {
    notifications,
    total,
    unreadCount,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Get notification by ID — returns null if not found.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getNotificationById(id) {
  return prisma.notification.findUnique({ where: { id } })
}

/**
 * Count unread notifications for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, isRead: false } })
}

/**
 * Mark a notification as read. Verifies ownership — throws 404 if wrong user.
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function markAsRead(id, userId) {
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) throw new NotFoundError(`Notification with ID '${id}' not found`)
  // Return a 404 (not 403) so we don't reveal whether the ID exists at all
  if (notification.userId !== userId) throw new NotFoundError('Notification not found')

  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  })
}

/**
 * Mark all notifications for a user as read.
 * @param {string} userId
 * @returns {Promise<{count: number}>}
 */
export async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
}

/**
 * Delete a notification. Verifies ownership.
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function deleteNotification(id, userId) {
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) throw new NotFoundError(`Notification with ID '${id}' not found`)
  if (notification.userId !== userId) throw new NotFoundError('Notification not found')

  return prisma.notification.delete({ where: { id } })
}

// ─────────────────────────────────────────────────────────────────
// Deduplication helper
// ─────────────────────────────────────────────────────────────────

/**
 * Check whether an active (unread) notification already exists for
 * a given user + type + referenceId combination.
 * Used to prevent alert spam.
 * @param {string} userId
 * @param {string} type
 * @param {string} referenceId
 * @returns {Promise<boolean>}
 */
async function hasActiveNotification(userId, type, referenceId) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type, referenceId, isRead: false },
    select: { id: true },
  })
  return existing !== null
}

/**
 * For a list of (userId, referenceId) pairs, filter out those that
 * already have an active unread notification of the given type.
 * @param {string[]} userIds
 * @param {string} type
 * @param {string} referenceId
 * @returns {Promise<string[]>} userIds that do NOT already have the notification
 */
async function deduplicateUserIds(userIds, type, referenceId) {
  if (!referenceId || userIds.length === 0) return userIds

  const existingNotifs = await prisma.notification.findMany({
    where: {
      userId: { in: userIds },
      type,
      referenceId,
      isRead: false,
    },
    select: { userId: true },
  })

  const alreadyNotified = new Set(existingNotifs.map((n) => n.userId))
  return userIds.filter((uid) => !alreadyNotified.has(uid))
}

// ─────────────────────────────────────────────────────────────────
// Auto-generation: Shelf-Life / Expiry
// ─────────────────────────────────────────────────────────────────

/**
 * Scan ShelfLifeRecords for items expiring within N days.
 * Creates EXPIRY_WARNING notifications for STOREKEEPER and PAO users.
 * Deduplicates: won't re-notify while an unread alert already exists.
 * @param {number} [daysUntilExpiry=30]
 * @returns {Promise<{created: number, recordsWarned: number, usersNotified: number}>}
 */
export async function generateExpiryNotifications(daysUntilExpiry = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysUntilExpiry)

  // Use ShelfLifeRecord — this is the correct model for expiry tracking
  const expiringRecords = await prisma.shelfLifeRecord.findMany({
    where: {
      status: { in: ['GOOD', 'EXPIRING_SOON'] },
      expiryDate: { lte: futureDate, gte: new Date() },
      quantity: { gt: 0 },
    },
    include: {
      item: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true } },
    },
  })

  if (expiringRecords.length === 0) return { created: 0, recordsWarned: 0, usersNotified: 0 }

  // Find STOREKEEPER + PAO users via role code
  const targetRoles = await prisma.role.findMany({
    where: { code: { in: ['STOREKEEPER', 'PAO'] } },
    select: { id: true },
  })
  const roleIds = targetRoles.map((r) => r.id)
  if (roleIds.length === 0) return { created: 0, recordsWarned: 0, usersNotified: 0 }

  const userRoles = await prisma.userRole.findMany({
    where: { roleId: { in: roleIds } },
    select: { userId: true },
  })
  const allUserIds = [...new Set(userRoles.map((ur) => ur.userId))]

  if (allUserIds.length === 0) return { created: 0, recordsWarned: 0, usersNotified: 0 }

  const notifications = []
  for (const record of expiringRecords) {
    const daysUntil = Math.ceil(
      (new Date(record.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    const itemName = record.item?.name || 'Unknown Item'
    const storeName = record.store?.name || 'Unknown Store'
    const referenceId = record.itemId

    // Deduplicate per user for this item
    const eligibleUserIds = await deduplicateUserIds(allUserIds, NOTIFICATION_TYPES.EXPIRY_WARNING, referenceId)

    for (const userId of eligibleUserIds) {
      notifications.push({
        userId,
        title: `Shelf-Life Warning: ${itemName}`,
        message: `${itemName} (batch: ${record.batchNumber || 'N/A'}) at ${storeName} expires in ${daysUntil} day(s). Qty: ${record.quantity}.`,
        type: NOTIFICATION_TYPES.EXPIRY_WARNING,
        priority: daysUntil <= 7 ? NOTIFICATION_PRIORITY.HIGH : NOTIFICATION_PRIORITY.MEDIUM,
        referenceId,
        referenceType: 'ITEM',
      })
    }
  }

  if (notifications.length === 0) return { created: 0, recordsWarned: expiringRecords.length, usersNotified: 0 }

  const result = await createBulkNotifications(notifications)
  return {
    created: result.count,
    recordsWarned: expiringRecords.length,
    usersNotified: new Set(notifications.map((n) => n.userId)).size,
  }
}

// ─────────────────────────────────────────────────────────────────
// Auto-generation: Low Stock
// ─────────────────────────────────────────────────────────────────

/**
 * Scan Items below their reorder point.
 * Creates LOW_STOCK notifications for STOREKEEPER and PAO users.
 * Deduplicates: won't re-notify while an unread LOW_STOCK alert exists for same item.
 * @returns {Promise<{created: number, itemsBelowReorder: number, usersNotified: number}>}
 */
export async function generateLowStockNotifications() {
  const items = await prisma.item.findMany({
    where: {
      reorderPoint: { not: null, gt: 0 },
      status: 'ACTIVE', // Fixed: was incorrectly referencing isActive (non-existent field)
    },
    select: {
      id: true,
      name: true,
      code: true,
      reorderPoint: true,
      stockCards: {
        select: { quantity: true },
      },
    },
  })

  // Filter to items actually below reorder point
  const lowStockItems = items.filter((item) => {
    const totalQty = item.stockCards.reduce((sum, sc) => sum + (sc.quantity || 0), 0)
    return totalQty <= (item.reorderPoint || 0)
  })

  if (lowStockItems.length === 0) return { created: 0, itemsBelowReorder: 0, usersNotified: 0 }

  // Find STOREKEEPER + PAO users via role code
  const targetRoles = await prisma.role.findMany({
    where: { code: { in: ['STOREKEEPER', 'PAO'] } },
    select: { id: true },
  })
  const roleIds = targetRoles.map((r) => r.id)
  if (roleIds.length === 0) return { created: 0, itemsBelowReorder: lowStockItems.length, usersNotified: 0 }

  const userRoles = await prisma.userRole.findMany({
    where: { roleId: { in: roleIds } },
    select: { userId: true },
  })
  const allUserIds = [...new Set(userRoles.map((ur) => ur.userId))]

  if (allUserIds.length === 0) return { created: 0, itemsBelowReorder: lowStockItems.length, usersNotified: 0 }

  const notifications = []
  for (const item of lowStockItems) {
    const totalQty = item.stockCards.reduce((sum, sc) => sum + (sc.quantity || 0), 0)

    // Deduplication: skip if an active LOW_STOCK notification already exists for this item
    const eligibleUserIds = await deduplicateUserIds(allUserIds, NOTIFICATION_TYPES.LOW_STOCK, item.id)

    for (const userId of eligibleUserIds) {
      notifications.push({
        userId,
        title: `Low Stock Alert: ${item.name}`,
        message: `${item.name} (${item.code}) stock is at ${totalQty} units, below reorder point of ${item.reorderPoint}. Reorder recommended.`,
        type: NOTIFICATION_TYPES.LOW_STOCK,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        referenceId: item.id,
        referenceType: 'ITEM',
      })
    }
  }

  if (notifications.length === 0) return { created: 0, itemsBelowReorder: lowStockItems.length, usersNotified: 0 }

  const result = await createBulkNotifications(notifications)
  return {
    created: result.count,
    itemsBelowReorder: lowStockItems.length,
    usersNotified: new Set(notifications.map((n) => n.userId)).size,
  }
}

// ─────────────────────────────────────────────────────────────────
// Auto-generation: Disposal Candidates
// ─────────────────────────────────────────────────────────────────

/**
 * Find shelf-life records past their expiry date with remaining stock.
 * Creates DISPOSAL_CANDIDATE notifications for PAO and TEC users.
 * @returns {Promise<{created: number, expiredItems: number, usersNotified: number}>}
 */
export async function generateDisposalCandidateNotifications() {
  const expiredRecords = await prisma.shelfLifeRecord.findMany({
    where: {
      expiryDate: { lt: new Date() },
      quantity: { gt: 0 },
    },
    include: {
      item: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true } },
    },
  })

  if (expiredRecords.length === 0) return { created: 0, expiredItems: 0, usersNotified: 0 }

  const targetRoles = await prisma.role.findMany({
    where: { code: { in: ['PAO', 'TEC'] } },
    select: { id: true },
  })
  const roleIds = targetRoles.map((r) => r.id)
  if (roleIds.length === 0) return { created: 0, expiredItems: expiredRecords.length, usersNotified: 0 }

  const userRoles = await prisma.userRole.findMany({
    where: { roleId: { in: roleIds } },
    select: { userId: true },
  })
  const allUserIds = [...new Set(userRoles.map((ur) => ur.userId))]

  if (allUserIds.length === 0) return { created: 0, expiredItems: expiredRecords.length, usersNotified: 0 }

  const notifications = []
  for (const record of expiredRecords) {
    const daysPastExpiry = Math.ceil(
      (Date.now() - new Date(record.expiryDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    const itemName = record.item?.name || 'Unknown Item'
    const storeName = record.store?.name || 'Unknown Store'

    const eligibleUserIds = await deduplicateUserIds(allUserIds, NOTIFICATION_TYPES.DISPOSAL_CANDIDATE, record.itemId)

    for (const userId of eligibleUserIds) {
      notifications.push({
        userId,
        title: `Disposal Candidate: ${itemName}`,
        message: `${itemName} (batch: ${record.batchNumber || 'N/A'}) at ${storeName} expired ${daysPastExpiry} day(s) ago. Qty: ${record.quantity}. Consider disposal.`,
        type: NOTIFICATION_TYPES.DISPOSAL_CANDIDATE,
        priority: NOTIFICATION_PRIORITY.HIGH,
        referenceId: record.itemId,
        referenceType: 'ITEM',
      })
    }
  }

  if (notifications.length === 0) return { created: 0, expiredItems: expiredRecords.length, usersNotified: 0 }

  const result = await createBulkNotifications(notifications)
  return {
    created: result.count,
    expiredItems: expiredRecords.length,
    usersNotified: new Set(notifications.map((n) => n.userId)).size,
  }
}
