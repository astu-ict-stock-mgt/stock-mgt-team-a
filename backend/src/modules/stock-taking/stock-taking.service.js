/**
 * Stock Take Service & Workflow Engine
 * Tasks: BE-142, BE-143, BE-144, BE-145, BE-146, BE-147, BE-148
 * SRS Traceability: Section 8 (Stock Taking), FR-30, FR-31, BR-14
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Generate sequential Stock Take Number STK-YYYY-XXXXX
 * @returns {Promise<string>}
 */
export async function generateStockTakeNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.stockTake.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `STK-${year}-${sequence}`
}

/**
 * Create a new Stock Take (BE-142)
 * @param {Object} params - { storeId, initiatedBy, scheduledDate, notes, itemIds }
 * @returns {Promise<Object>}
 */
export async function createStockTake({ storeId, initiatedBy, scheduledDate, notes, itemIds }) {
  if (!storeId) throw new ValidationError('storeId is required')
  if (!initiatedBy) throw new ValidationError('initiatedBy is required')

  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) throw new NotFoundError(`Store with ID '${storeId}' not found`)

  const stockTakeNumber = await generateStockTakeNumber()

  return prisma.$transaction(async (tx) => {
    const stockTake = await tx.stockTake.create({
      data: {
        stockTakeNumber,
        storeId,
        status: 'PLANNED',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        initiatedBy,
        notes: notes || null,
      },
    })

    if (Array.isArray(itemIds) && itemIds.length > 0) {
      for (const itemId of itemIds) {
        const stockCard = await tx.stockCard.findUnique({
          where: { itemId_storeId: { itemId, storeId } },
        })

        await tx.stockTakeLine.create({
          data: {
            stockTakeId: stockTake.id,
            itemId,
            bookQuantity: stockCard?.quantity || 0,
            physicalCount: null,
            variance: 0,
          },
        })
      }
    }

    return tx.stockTake.findUnique({
      where: { id: stockTake.id },
      include: {
        store: { select: { id: true, name: true, code: true } },
        initiatedByUser: { select: { id: true, fullName: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })
  })
}

/**
 * Get Stock Take by ID (BE-143)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getStockTakeById(id) {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, code: true } },
      initiatedByUser: { select: { id: true, fullName: true } },
      completedByUser: { select: { id: true, fullName: true } },
      reconciledByUser: { select: { id: true, fullName: true } },
      lines: {
        include: {
          item: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
        },
        orderBy: { item: { name: 'asc' } },
      },
    },
  })

  if (!stockTake) throw new NotFoundError(`Stock Take with ID '${id}' not found`)
  return stockTake
}

/**
 * List Stock Takes with filters and pagination (BE-143)
 * @param {Object} filters - { status, storeId, page, limit }
 * @returns {Promise<Object>}
 */
export async function listStockTakes(filters = {}) {
  const { status, storeId, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(storeId && { storeId }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [stockTakes, total] = await Promise.all([
    prisma.stockTake.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        initiatedByUser: { select: { id: true, fullName: true } },
        _count: { select: { lines: true } },
      },
    }),
    prisma.stockTake.count({ where }),
  ])

  return {
    stockTakes,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Start Stock Take - transition PLANNED -> IN_PROGRESS (BE-144)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function startStockTake(id) {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id },
    include: { lines: true },
  })

  if (!stockTake) throw new NotFoundError(`Stock Take with ID '${id}' not found`)
  if (stockTake.status !== 'PLANNED') {
    throw new ConflictError(`Stock Take cannot be started from status '${stockTake.status}'`)
  }

  return prisma.$transaction(async (tx) => {
    if (stockTake.lines.length === 0) {
      const stockCards = await tx.stockCard.findMany({
        where: { storeId: stockTake.storeId, quantity: { gt: 0 } },
      })

      for (const sc of stockCards) {
        await tx.stockTakeLine.create({
          data: {
            stockTakeId: id,
            itemId: sc.itemId,
            bookQuantity: sc.quantity,
            physicalCount: null,
            variance: 0,
          },
        })
      }
    }

    return tx.stockTake.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: {
        store: { select: { id: true, name: true, code: true } },
        lines: {
          include: { item: { select: { id: true, name: true, code: true } } },
        },
      },
    })
  })
}

/**
 * Record Physical Count for a Stock Take Line (BE-145)
 * @param {Object} params - { stockTakeId, itemId, physicalCount, locationId, countedBy, varianceReason }
 * @returns {Promise<Object>}
 */
export async function recordPhysicalCount({ stockTakeId, itemId, physicalCount, locationId, countedBy, varianceReason }) {
  const stockTake = await prisma.stockTake.findUnique({ where: { id: stockTakeId } })
  if (!stockTake) throw new NotFoundError(`Stock Take with ID '${stockTakeId}' not found`)
  if (stockTake.status !== 'IN_PROGRESS') {
    throw new ConflictError(`Can only record counts for stock takes in IN_PROGRESS status`)
  }

  const line = await prisma.stockTakeLine.findUnique({
    where: { uq_stocktake_line_item: { stockTakeId, itemId } },
  })
  if (!line) throw new NotFoundError(`Stock take line not found for item '${itemId}'`)

  const variance = physicalCount - line.bookQuantity

  return prisma.stockTakeLine.update({
    where: { id: line.id },
    data: {
      physicalCount,
      variance,
      locationId: locationId || null,
      countedBy: countedBy || null,
      countedAt: new Date(),
      varianceReason: varianceReason || null,
    },
    include: {
      item: { select: { id: true, name: true, code: true } },
    },
  })
}

/**
 * Complete Stock Take - transition IN_PROGRESS -> COMPLETED (BE-146)
 * @param {string} id
 * @param {string} completedBy
 * @returns {Promise<Object>}
 */
export async function completeStockTake(id, completedBy) {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id },
    include: { lines: true },
  })

  if (!stockTake) throw new NotFoundError(`Stock Take with ID '${id}' not found`)
  if (stockTake.status !== 'IN_PROGRESS') {
    throw new ConflictError(`Stock Take cannot be completed from status '${stockTake.status}'`)
  }

  const uncounted = stockTake.lines.filter((l) => l.physicalCount === null)
  if (uncounted.length > 0) {
    throw new ConflictError(`${uncounted.length} item(s) have not been counted yet`)
  }

  return prisma.stockTake.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date(), completedBy: completedBy || null },
    include: {
      store: { select: { id: true, name: true, code: true } },
      lines: {
        include: { item: { select: { id: true, name: true, code: true } } },
      },
    },
  })
}

/**
 * Reconcile Stock Take - adjust stock cards based on variances (BE-147)
 * @param {string} id
 * @param {string} reconciledBy
 * @returns {Promise<Object>}
 */
export async function reconcileStockTake(id, reconciledBy) {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id },
    include: { lines: true },
  })

  if (!stockTake) throw new NotFoundError(`Stock Take with ID '${id}' not found`)
  if (stockTake.status !== 'COMPLETED') {
    throw new ConflictError(`Stock Take cannot be reconciled from status '${stockTake.status}'`)
  }

  return prisma.$transaction(async (tx) => {
    for (const line of stockTake.lines) {
      if (line.variance !== 0 && line.physicalCount !== null) {
        const stockCard = await tx.stockCard.findUnique({
          where: { itemId_storeId: { itemId: line.itemId, storeId: stockTake.storeId } },
        })

        if (stockCard) {
          const newQuantity = line.physicalCount
          const newAvailable = newQuantity - stockCard.reservedQty

          await tx.stockCard.update({
            where: { id: stockCard.id },
            data: {
              quantity: newQuantity,
              availableQty: Math.max(0, newAvailable),
              lastMovementAt: new Date(),
            },
          })

          await tx.stockCardTransaction.create({
            data: {
              stockCardId: stockCard.id,
              transactionType: 'ADJUSTMENT',
              quantity: line.variance,
              balanceAfter: newQuantity,
              referenceType: 'STOCK_TAKE',
              referenceId: stockTake.id,
              referenceNumber: stockTake.stockTakeNumber,
              notes: `Stock take adjustment. Variance: ${line.variance > 0 ? '+' : ''}${line.variance}`,
              createdBy: reconciledBy || stockTake.initiatedBy,
            },
          })
        }
      }
    }

    return tx.stockTake.update({
      where: { id },
      data: { status: 'RECONCILED', reconciledAt: new Date(), reconciledBy: reconciledBy || null },
      include: {
        store: { select: { id: true, name: true, code: true } },
        lines: {
          include: { item: { select: { id: true, name: true, code: true } } },
        },
      },
    })
  })
}

/**
 * Get Stock Take Variance Summary (BE-148)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getVarianceSummary(id) {
  const stockTake = await getStockTakeById(id)

  const lines = stockTake.lines || []
  const totalItems = lines.length
  const itemsWithVariance = lines.filter((l) => l.variance !== 0)
  const totalBookQuantity = lines.reduce((sum, l) => sum + l.bookQuantity, 0)
  const totalPhysicalCount = lines.reduce((sum, l) => sum + (l.physicalCount || 0), 0)
  const totalVariance = totalPhysicalCount - totalBookQuantity

  const overages = itemsWithVariance.filter((l) => l.variance > 0)
  const shortages = itemsWithVariance.filter((l) => l.variance < 0)

  return {
    stockTakeId: stockTake.id,
    stockTakeNumber: stockTake.stockTakeNumber,
    status: stockTake.status,
    totalItems,
    itemsWithVariance: itemsWithVariance.length,
    itemsWithoutVariance: totalItems - itemsWithVariance.length,
    totalBookQuantity,
    totalPhysicalCount,
    totalVariance,
    overages: {
      count: overages.length,
      items: overages.map((l) => ({
        itemId: l.itemId,
        itemName: l.item?.name,
        variance: l.variance,
      })),
    },
    shortages: {
      count: shortages.length,
      items: shortages.map((l) => ({
        itemId: l.itemId,
        itemName: l.item?.name,
        variance: l.variance,
      })),
    },
    lines,
  }
}
