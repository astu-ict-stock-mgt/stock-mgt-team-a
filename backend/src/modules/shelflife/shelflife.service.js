/**
 * Shelf-Life & Expiry Monitoring Service
 * Tasks: BE-132 (Shelf-Life Schema) & BE-133 (Shelf-Life Monitoring Service)
 * SRS Traceability: Section 10.1 (Core Entities),
 *                   FR-37 (perishable item expiry monitoring & alerts),
 *                   Clarification C-12 (per-batch expiry tracking: HEALTHY, NEAR_EXPIRY, EXPIRED),
 *                   Appendix C (Role: SHELFLIFE_READ permission)
 */

import { prisma } from '../../config/database.js'
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../utils/errors.js'
import {
  recordBatchSchema,
  queryBatchesSchema,
} from './dto/shelflife.dto.js'

export class ShelfLifeService {
  /**
   * Pure domain helper: Evaluate expiry health status and days remaining
   * SRS Clarification C-12
   *
   * @param {Date|string} expiryDate - Batch expiry date
   * @param {number} [alertDays=30] - Warning alert threshold in days
   * @param {Date|string} [asOfDate=new Date()] - Evaluation reference date
   * @returns {{ status: 'HEALTHY'|'NEAR_EXPIRY'|'EXPIRED', daysUntilExpiry: number, isExpired: boolean, isNearExpiry: boolean }}
   */
  static calculateStatus(expiryDate, alertDays = 30, asOfDate = new Date()) {
    const expiry = new Date(expiryDate)
    const refDate = new Date(asOfDate)

    const diffMs = expiry.getTime() - refDate.getTime()
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    let status = 'HEALTHY'
    let isExpired = false
    let isNearExpiry = false

    if (daysUntilExpiry < 0) {
      status = 'EXPIRED'
      isExpired = true
    } else if (daysUntilExpiry <= alertDays) {
      status = 'NEAR_EXPIRY'
      isNearExpiry = true
    }

    return {
      status,
      daysUntilExpiry,
      isExpired,
      isNearExpiry,
    }
  }

  /**
   * Enriches a database record with real-time calculated status metadata
   * @param {Object} record
   * @param {Date} [asOfDate=new Date()]
   * @returns {Object} Enriched record
   */
  static enrichRecord(record, asOfDate = new Date()) {
    if (!record) {
      return null
    }
    const calc = ShelfLifeService.calculateStatus(
      record.expiryDate,
      record.alertDaysBeforeExpiry ?? 30,
      asOfDate
    )

    return {
      ...record,
      daysUntilExpiry: calc.daysUntilExpiry,
      currentStatus: calc.status,
      isExpired: calc.isExpired,
      isNearExpiry: calc.isNearExpiry,
    }
  }

  /**
   * Register a new shelf-life batch record
   * @param {Object} batchData
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Object>} Created shelf-life record
   */
  static async recordBatch(batchData, dbClient = prisma) {
    const validated = recordBatchSchema.parse(batchData)
    const {
      itemId,
      batchNumber,
      quantity,
      expiryDate,
      alertDaysBeforeExpiry = 30,
      storeId,
      locationId,
      notes,
    } = validated

    // 1. Verify item existence
    const item = await dbClient.item.findUnique({
      where: { id: itemId },
      select: { id: true, code: true, name: true },
    })
    if (!item) {
      throw new NotFoundError(`Item with ID ${itemId} not found`)
    }

    // 2. Check uniqueness on [itemId, batchNumber]
    const existing = await dbClient.shelfLifeRecord.findUnique({
      where: {
        uq_shelflife_item_batch: {
          itemId,
          batchNumber,
        },
      },
    })
    if (existing) {
      throw new ConflictError(
        `Batch number "${batchNumber}" is already registered for item "${item.name}" (${item.code})`
      )
    }

    // 3. Compute initial status
    const calc = ShelfLifeService.calculateStatus(expiryDate, alertDaysBeforeExpiry)

    // 4. Create record
    const record = await dbClient.shelfLifeRecord.create({
      data: {
        itemId,
        batchNumber,
        quantity,
        expiryDate: new Date(expiryDate),
        alertDaysBeforeExpiry,
        status: calc.status,
        storeId,
        locationId,
        notes,
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
    })

    return ShelfLifeService.enrichRecord(record)
  }

  /**
   * Query shelf-life batches with filters, search, and pagination
   * @param {Object} queryParams
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<{ records: Array, total: number, limit: number, offset: number }>}
   */
  static async getBatches(queryParams = {}, dbClient = prisma) {
    const {
      storeId,
      itemId,
      status,
      expiryBefore,
      expiryAfter,
      search,
      limit = 50,
      offset = 0,
    } = queryBatchesSchema.parse(queryParams)

    const where = {
      ...(storeId && { storeId }),
      ...(itemId && { itemId }),
      ...(status && { status }),
      ...((expiryBefore || expiryAfter) && {
        expiryDate: {
          ...(expiryBefore && { lte: new Date(expiryBefore) }),
          ...(expiryAfter && { gte: new Date(expiryAfter) }),
        },
      }),
      ...(search && {
        OR: [
          { batchNumber: { contains: search, mode: 'insensitive' } },
          { item: { name: { contains: search, mode: 'insensitive' } } },
          { item: { code: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    const [rawRecords, total] = await Promise.all([
      dbClient.shelfLifeRecord.findMany({
        where,
        include: {
          item: { select: { id: true, code: true, name: true } },
          store: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true } },
        },
        orderBy: { expiryDate: 'asc' },
        take: limit,
        skip: offset,
      }),
      dbClient.shelfLifeRecord.count({ where }),
    ])

    const records = rawRecords.map((r) => ShelfLifeService.enrichRecord(r))

    return {
      records,
      total,
      limit,
      offset,
    }
  }

  /**
   * Retrieve a single batch by ID
   * @param {string} id
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Object>}
   */
  static async getBatchById(id, dbClient = prisma) {
    const record = await dbClient.shelfLifeRecord.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
    })

    if (!record) {
      throw new NotFoundError(`Shelf-life record with ID ${id} not found`)
    }

    return ShelfLifeService.enrichRecord(record)
  }

  /**
   * Get all expiring batches (near expiry) for alert dashboards
   * @param {string} [storeId]
   * @param {number} [daysThreshold] - Optional custom threshold override
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Array>}
   */
  static async getExpiringBatches(storeId = null, daysThreshold = null, dbClient = prisma) {
    const now = new Date()
    const thresholdDays = daysThreshold ?? 30
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + thresholdDays)

    const rawRecords = await dbClient.shelfLifeRecord.findMany({
      where: {
        ...(storeId && { storeId }),
        quantity: { gt: 0 },
        expiryDate: {
          gte: now,
          lte: targetDate,
        },
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    })

    return rawRecords.map((r) => ShelfLifeService.enrichRecord(r, now))
  }

  /**
   * Get all expired batches
   * @param {string} [storeId]
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Array>}
   */
  static async getExpiredBatches(storeId = null, dbClient = prisma) {
    const now = new Date()

    const rawRecords = await dbClient.shelfLifeRecord.findMany({
      where: {
        ...(storeId && { storeId }),
        quantity: { gt: 0 },
        expiryDate: { lt: now },
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    })

    return rawRecords.map((r) => ShelfLifeService.enrichRecord(r, now))
  }

  /**
   * Aggregate high-level health dashboard metrics
   * @param {string} [storeId]
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Object>}
   */
  static async getDashboardSummary(storeId = null, dbClient = prisma) {
    const now = new Date()

    const allRecords = await dbClient.shelfLifeRecord.findMany({
      where: {
        ...(storeId && { storeId }),
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    })

    let totalQuantity = 0
    let healthyCount = 0
    let healthyQuantity = 0
    let nearExpiryCount = 0
    let nearExpiryQuantity = 0
    let expiredCount = 0
    let expiredQuantity = 0

    const enriched = allRecords.map((r) => {
      const item = ShelfLifeService.enrichRecord(r, now)
      totalQuantity += item.quantity

      if (item.currentStatus === 'EXPIRED') {
        expiredCount++
        expiredQuantity += item.quantity
      } else if (item.currentStatus === 'NEAR_EXPIRY') {
        nearExpiryCount++
        nearExpiryQuantity += item.quantity
      } else {
        healthyCount++
        healthyQuantity += item.quantity
      }

      return item
    })

    // Critical list: top 10 expired or near-expiry batches
    const criticalBatches = enriched
      .filter((b) => b.isExpired || b.isNearExpiry)
      .slice(0, 10)

    return {
      storeId,
      asOfDate: now,
      totalBatches: allRecords.length,
      totalQuantity,
      healthy: {
        count: healthyCount,
        quantity: healthyQuantity,
      },
      nearExpiry: {
        count: nearExpiryCount,
        quantity: nearExpiryQuantity,
      },
      expired: {
        count: expiredCount,
        quantity: expiredQuantity,
      },
      criticalBatches,
    }
  }

  /**
   * Retrieve candidate batches for disposal request generation (BE-135 integration)
   * @param {string} [storeId]
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Array>}
   */
  static async getDisposalCandidates(storeId = null, dbClient = prisma) {
    const now = new Date()

    const candidateRecords = await dbClient.shelfLifeRecord.findMany({
      where: {
        ...(storeId && { storeId }),
        quantity: { gt: 0 },
        expiryDate: { lte: now },
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    })

    return candidateRecords.map((r) => ({
      ...ShelfLifeService.enrichRecord(r, now),
      candidateReason: 'EXPIRED_SHELF_LIFE',
      recommendedAction: 'DISPOSAL_REQUEST',
    }))
  }

  /**
   * Adjust batch quantity on receipt, issue, transfer, or count adjustment
   * @param {string} batchId
   * @param {number} quantityDelta - Positive for receipt/return, negative for issue
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Object>}
   */
  static async updateBatchQuantity(batchId, quantityDelta, dbClient = prisma) {
    const existing = await dbClient.shelfLifeRecord.findUnique({
      where: { id: batchId },
    })

    if (!existing) {
      throw new NotFoundError(`Shelf-life record ${batchId} not found`)
    }

    const newQuantity = existing.quantity + quantityDelta
    if (newQuantity < 0) {
      throw new ValidationError(
        `Insufficient batch quantity. Current: ${existing.quantity}, requested deduction: ${Math.abs(quantityDelta)}`
      )
    }

    const updated = await dbClient.shelfLifeRecord.update({
      where: { id: batchId },
      data: {
        quantity: newQuantity,
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
    })

    return ShelfLifeService.enrichRecord(updated)
  }

  /**
   * Sync and refresh persisted status columns for all batches
   * @param {string} [storeId]
   * @param {Date} [asOfDate=new Date()]
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<{ updatedCount: number }>}
   */
  static async refreshBatchStatuses(storeId = null, asOfDate = new Date(), dbClient = prisma) {
    const records = await dbClient.shelfLifeRecord.findMany({
      where: {
        ...(storeId && { storeId }),
      },
    })

    let updatedCount = 0

    for (const record of records) {
      const calc = ShelfLifeService.calculateStatus(
        record.expiryDate,
        record.alertDaysBeforeExpiry,
        asOfDate
      )

      if (calc.status !== record.status) {
        await dbClient.shelfLifeRecord.update({
          where: { id: record.id },
          data: { status: calc.status },
        })
        updatedCount++
      }
    }

    return { updatedCount }
  }
}

export default ShelfLifeService

// Named exports for controller compatibility (BE-134, BE-135)
export const createBatchRecord = (data) => ShelfLifeService.recordBatch(data)
export const getBatchById = (id) => ShelfLifeService.getBatchById(id)
export const listBatches = (params) => ShelfLifeService.getBatches(params)
export const getExpiringBatches = (params) => {
  const storeId = params?.storeId || null
  const daysThreshold = params?.daysThreshold ? Number(params.daysThreshold) : null
  return ShelfLifeService.getExpiringBatches(storeId, daysThreshold)
}
export const evaluateBatchStatuses = () => ShelfLifeService.refreshBatchStatuses()
export const detectDisposalCandidates = (params) => {
  const storeId = params?.storeId || null
  return ShelfLifeService.getDisposalCandidates(storeId)
}
