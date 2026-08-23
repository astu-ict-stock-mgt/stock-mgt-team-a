/**
 * Central Shelf-Life & Expiry Status Calculation Engine & Service
 * Tasks: BE-132, BE-134 (Implement Expiry/Status Rules)
 * SRS Traceability: Section 10 (Shelf-Life & Expiry Module), Clarification Register C-12
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Pure calculation engine computing ShelfLifeStatus from expiry date & threshold (SRS C-12)
 * Rules:
 * - EXPIRED: referenceDate >= expiryDate
 * - NEAR_EXPIRY: referenceDate < expiryDate <= referenceDate + alertDaysBeforeExpiry
 * - HEALTHY: expiryDate > referenceDate + alertDaysBeforeExpiry
 * 
 * @param {Date|string} expiryDate 
 * @param {number} [alertDaysBeforeExpiry=30] 
 * @param {Date} [referenceDate=new Date()] 
 * @returns {'HEALTHY' | 'NEAR_EXPIRY' | 'EXPIRED'}
 */
export function computeShelfLifeStatus(expiryDate, alertDaysBeforeExpiry = 30, referenceDate = new Date()) {
  const exp = new Date(expiryDate)
  const ref = new Date(referenceDate)
  const alertDays = parseInt(String(alertDaysBeforeExpiry), 10) || 30

  // Calculate difference in days
  const diffTime = exp.getTime() - ref.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return 'EXPIRED'
  } else if (diffDays <= alertDays) {
    return 'NEAR_EXPIRY'
  } else {
    return 'HEALTHY'
  }
}

/**
 * Register a new ShelfLifeRecord batch
 * @param {Object} data - { itemId, batchNumber, quantity, expiryDate, alertDaysBeforeExpiry, storeId, locationId, notes }
 * @returns {Promise<Object>} Created ShelfLifeRecord
 */
export async function createBatchRecord({
  itemId,
  batchNumber,
  quantity,
  expiryDate,
  alertDaysBeforeExpiry = 30,
  storeId,
  locationId,
  notes,
}) {
  if (!itemId) throw new ValidationError('itemId is required')
  if (!batchNumber || batchNumber.trim().length === 0) throw new ValidationError('batchNumber is required')
  if (!quantity || quantity <= 0) throw new ValidationError('quantity must be greater than zero')
  if (!expiryDate) throw new ValidationError('expiryDate is required')

  const status = computeShelfLifeStatus(expiryDate, alertDaysBeforeExpiry)

  try {
    const record = await prisma.shelfLifeRecord.create({
      data: {
        itemId,
        batchNumber,
        quantity: parseInt(String(quantity), 10),
        expiryDate: new Date(expiryDate),
        alertDaysBeforeExpiry: parseInt(String(alertDaysBeforeExpiry), 10) || 30,
        status,
        storeId: storeId || null,
        locationId: locationId || null,
        notes: notes || null,
      },
      include: {
        item: { select: { id: true, name: true, code: true } },
        store: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, code: true } },
      },
    })
    return record
  } catch (err) {
    if (err.code === 'P2002') {
      throw new ConflictError(`Batch '${batchNumber}' already exists for item '${itemId}'`)
    }
    throw err
  }
}

/**
 * Get ShelfLifeRecord by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getBatchById(id) {
  const record = await prisma.shelfLifeRecord.findUnique({
    where: { id },
    include: {
      item: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true, code: true } },
      location: { select: { id: true, name: true, code: true } },
    },
  })

  if (!record) {
    throw new NotFoundError(`ShelfLifeRecord with ID '${id}' not found`)
  }

  return record
}

/**
 * List ShelfLifeRecords with filters and pagination
 * @param {Object} [filters={}] - { status, storeId, itemId, search, page, limit }
 * @returns {Promise<Object>}
 */
export async function listBatches(filters = {}) {
  const { status, storeId, itemId, search, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(storeId && { storeId }),
    ...(itemId && { itemId }),
    ...(search && {
      OR: [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { item: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [batches, total] = await Promise.all([
    prisma.shelfLifeRecord.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { expiryDate: 'asc' },
      include: {
        item: { select: { id: true, name: true, code: true } },
        store: { select: { id: true, name: true } },
      },
    }),
    prisma.shelfLifeRecord.count({ where }),
  ])

  return {
    batches,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Get Near-Expiry and Expired Batches (SRS Section 10 Alert View)
 * @param {Object} [filters={}] - { storeId, days }
 * @returns {Promise<Array<Object>>}
 */
export async function getExpiringBatches(filters = {}) {
  const { storeId } = filters

  const batches = await prisma.shelfLifeRecord.findMany({
    where: {
      status: { in: ['NEAR_EXPIRY', 'EXPIRED'] },
      ...(storeId && { storeId }),
    },
    orderBy: { expiryDate: 'asc' },
    include: {
      item: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true } },
    },
  })

  return batches
}

/**
 * Sweep and evaluate all ShelfLifeRecord statuses in database (BE-134)
 * Re-calculates status dynamically using current system date
 * @returns {Promise<Object>} Evaluation summary
 */
export async function evaluateBatchStatuses() {
  const allBatches = await prisma.shelfLifeRecord.findMany()
  const referenceDate = new Date()

  let updatedCount = 0
  let healthyCount = 0
  let nearExpiryCount = 0
  let expiredCount = 0

  for (const batch of allBatches) {
    const newStatus = computeShelfLifeStatus(batch.expiryDate, batch.alertDaysBeforeExpiry, referenceDate)

    if (newStatus === 'HEALTHY') healthyCount++
    if (newStatus === 'NEAR_EXPIRY') nearExpiryCount++
    if (newStatus === 'EXPIRED') expiredCount++

    if (newStatus !== batch.status) {
      await prisma.shelfLifeRecord.update({
        where: { id: batch.id },
        data: { status: newStatus },
      })
      updatedCount++
    }
  }

  return {
    totalEvaluated: allBatches.length,
    updatedCount,
    healthyCount,
    nearExpiryCount,
    expiredCount,
    evaluatedAt: referenceDate.toISOString(),
  }
}
