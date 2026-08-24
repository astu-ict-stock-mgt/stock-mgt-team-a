/**
 * Inventory Valuation Service
 * Task: BE-148 (Implement Inventory Valuation API)
 * SRS Traceability: Section 12 (Reporting & Inventory Valuation)
 */

import { prisma } from '../../config/database.js'

/**
 * Compute inventory valuation report with store and category aggregations
 * @param {Object} [filters={}] - { storeId, categoryId, search, page, limit }
 * @returns {Promise<Object>} Valuation report summary and items list
 */
export async function getInventoryValuationReport(filters = {}) {
  const { storeId, categoryId, search, page = 1, limit = 20 } = filters

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 20
  const skip = (pageNum - 1) * limitNum

  const where = {
    ...(storeId && { storeId }),
    ...(categoryId && { item: { categoryId } }),
    ...(search && {
      OR: [
        { item: { name: { contains: search, mode: 'insensitive' } } },
        { item: { code: { contains: search, mode: 'insensitive' } } },
        { store: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  }

  const [stockCards, total] = await Promise.all([
    prisma.stockCard.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            unitPrice: true,
            category: { select: { id: true, name: true } },
            unit: { select: { id: true, code: true, name: true } },
          },
        },
        store: { select: { id: true, code: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.stockCard.count({ where }),
  ])

  let overallQuantity = 0
  let overallValuation = 0
  const storeMap = new Map()
  const categoryMap = new Map()

  const items = stockCards.map((sc) => {
    const qty = sc.availableQty || 0
    const price = sc.item?.unitPrice ? Number(sc.item.unitPrice) : 0
    const totalValue = qty * price

    overallQuantity += qty
    overallValuation += totalValue

    // Store breakdown aggregation
    const storeName = sc.store?.name || 'Unknown Store'
    const storeData = storeMap.get(storeName) || { quantity: 0, totalValue: 0 }
    storeMap.set(storeName, {
      quantity: storeData.quantity + qty,
      totalValue: storeData.totalValue + totalValue,
    })

    // Category breakdown aggregation
    const catName = sc.item?.category?.name || 'Uncategorized'
    const catData = categoryMap.get(catName) || { quantity: 0, totalValue: 0 }
    categoryMap.set(catName, {
      quantity: catData.quantity + qty,
      totalValue: catData.totalValue + totalValue,
    })

    return {
      stockCardId: sc.id,
      itemId: sc.itemId,
      itemCode: sc.item?.code,
      itemName: sc.item?.name,
      categoryName: sc.item?.category?.name,
      unitCode: sc.item?.unit?.code,
      storeId: sc.storeId,
      storeName: sc.store?.name,
      availableQty: qty,
      unitPrice: price,
      totalValue,
      lastTransactionDate: sc.updatedAt,
    }
  })

  return {
    summary: {
      totalItemsEvaluated: total,
      totalQuantity: overallQuantity,
      totalValuation: Number(overallValuation.toFixed(2)),
      breakdownByStore: Array.from(storeMap.entries()).map(([storeName, data]) => ({
        storeName,
        quantity: data.quantity,
        totalValue: Number(data.totalValue.toFixed(2)),
      })),
      breakdownByCategory: Array.from(categoryMap.entries()).map(([categoryName, data]) => ({
        categoryName,
        quantity: data.quantity,
        totalValue: Number(data.totalValue.toFixed(2)),
      })),
    },
    items,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}
