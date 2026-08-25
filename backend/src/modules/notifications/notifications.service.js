/**
 * Notifications Service
 * Task: BE-150
 * SRS Traceability: Section 6.6 (Notifications), FR-40
 */

import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../utils/errors.js'

/**
 * Create a notification
 * @param {Object} params - { userId, title, message, type, referenceId, referenceType }
 * @returns {Promise<Object>}
 */
export async function createNotification({ userId, title, message, type = 'INFO', referenceId, referenceType }) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
    },
  })
}

/**
 * Create multiple notifications at once
 * @param {Array} notifications
 * @returns {Promise<Object>}
 */
export async function createBulkNotifications(notifications) {
  return prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type || 'INFO',
      referenceId: n.referenceId || null,
      referenceType: n.referenceType || null,
    })),
  })
}

/**
 * Get notifications for a user
 * @param {string} userId
 * @param {Object} params - { unreadOnly, page, limit }
 * @returns {Promise<Object>}
 */
export async function getUserNotifications(userId, { unreadOnly = false, page = 1, limit = 20 } = {}) {
  const where = {
    userId,
    ...(unreadOnly && { isRead: false }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 20
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
 * Mark a notification as read
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function markAsRead(id, userId) {
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) throw new NotFoundError(`Notification with ID '${id}' not found`)
  if (notification.userId !== userId) throw new NotFoundError('Notification not found')

  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  })
}

/**
 * Mark all notifications for a user as read
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
}

/**
 * Delete a notification
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

/**
 * Auto-generate expiry notifications for items expiring within N days
 * @param {number} daysUntilExpiry
 * @returns {Promise<Object>}
 */
export async function generateExpiryNotifications(daysUntilExpiry = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysUntilExpiry)

  const cards = await prisma.stockCard.findMany({
    where: {
      quantity: { gt: 0 },
      expiryDate: { not: null, lte: futureDate, gte: new Date() },
    },
    include: {
      item: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true } },
    },
  })

  const storeManagers = await prisma.userRole.findMany({
    where: { roleId: { in: ['store-manager', 'inventory-manager', 'inventory-staff'] } },
    select: { userId: true },
  })
  const userIds = [...new Set(storeManagers.map((r) => r.userId))]

  if (userIds.length === 0 || cards.length === 0) return { created: 0 }

  const notifications = []
  for (const card of cards) {
    const daysUntil = Math.ceil(
      (new Date(card.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    for (const userId of userIds) {
      notifications.push({
        userId,
        title: `Item Expiring Soon: ${card.item?.name || 'Unknown'}`,
        message: `Item ${card.item?.name} (batch: ${card.batchNumber || 'N/A'}) at ${card.store?.name} expires in ${daysUntil} day(s). Quantity: ${card.quantity}.`,
        type: 'EXPIRY_WARNING',
        referenceId: card.itemId,
        referenceType: 'ITEM',
      })
    }
  }

  const result = await createBulkNotifications(notifications)
  return { created: result.count, itemsExpiring: cards.length, usersNotified: userIds.length }
}

/**
 * Auto-generate low-stock notifications for items below reorder point
 * Task: BE-150
 * @returns {Promise<Object>} { created, itemsBelowReorder, usersNotified }
 */
export async function generateLowStockNotifications() {
  // Find items where total stock across all cards is below reorder point
  const items = await prisma.item.findMany({
    where: {
      reorderPoint: { not: null, gt: 0 },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      reorderPoint: true,
      stockCards: {
        where: { quantity: { gt: 0 } },
        select: { quantity: true },
      },
    },
  })

  // Filter to items actually below reorder point
  const lowStockItems = items.filter((item) => {
    const totalQty = item.stockCards.reduce((sum, sc) => sum + (sc.quantity || 0), 0)
    return totalQty <= item.reorderPoint
  })

  if (lowStockItems.length === 0) return { created: 0, itemsBelowReorder: 0, usersNotified: 0 }

  // Notify storekeepers and PAO
  const targetUsers = await prisma.userRole.findMany({
    where: {
      role: { code: { in: ['STOREKEEPER', 'PAO'] } },
    },
    select: { userId: true },
  })
  const userIds = [...new Set(targetUsers.map((r) => r.userId))]

  if (userIds.length === 0) return { created: 0, itemsBelowReorder: lowStockItems.length, usersNotified: 0 }

  const notifications = []
  for (const item of lowStockItems) {
    const totalQty = item.stockCards.reduce((sum, sc) => sum + (sc.quantity || 0), 0)
    for (const userId of userIds) {
      notifications.push({
        userId,
        title: `Low Stock Alert: ${item.name}`,
        message: `${item.name} (${item.code}) stock is at ${totalQty} units, below reorder point of ${item.reorderPoint}. Reorder recommended.`,
        type: 'LOW_STOCK',
        referenceId: item.id,
        referenceType: 'ITEM',
      })
    }
  }

  const result = await createBulkNotifications(notifications)
  return { created: result.count, itemsBelowReorder: lowStockItems.length, usersNotified: userIds.length }
}

/**
 * Auto-generate disposal candidate notifications for expired items
 * Task: BE-150
 * @returns {Promise<Object>} { created, expiredItems, usersNotified }
 */
export async function generateDisposalCandidateNotifications() {
  // Find stock cards with past expiry dates that still have quantity
  const expiredCards = await prisma.stockCard.findMany({
    where: {
      quantity: { gt: 0 },
      expiryDate: { not: null, lt: new Date() },
    },
    include: {
      item: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true } },
    },
  })

  if (expiredCards.length === 0) return { created: 0, expiredItems: 0, usersNotified: 0 }

  // Notify PAO and TEC
  const targetUsers = await prisma.userRole.findMany({
    where: {
      role: { code: { in: ['PAO', 'TEC'] } },
    },
    select: { userId: true },
  })
  const userIds = [...new Set(targetUsers.map((r) => r.userId))]

  if (userIds.length === 0) return { created: 0, expiredItems: expiredCards.length, usersNotified: 0 }

  const notifications = []
  for (const card of expiredCards) {
    const daysPastExpiry = Math.ceil(
      (Date.now() - new Date(card.expiryDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    for (const userId of userIds) {
      notifications.push({
        userId,
        title: `Disposal Candidate: ${card.item?.name || 'Unknown'}`,
        message: `${card.item?.name} (batch: ${card.batchNumber || 'N/A'}) at ${card.store?.name} expired ${daysPastExpiry} day(s) ago. Qty: ${card.quantity}. Consider disposal.`,
        type: 'DISPOSAL_CANDIDATE',
        referenceId: card.itemId,
        referenceType: 'ITEM',
      })
    }
  }

  const result = await createBulkNotifications(notifications)
  return { created: result.count, expiredItems: expiredCards.length, usersNotified: userIds.length }
}
