/**
 * Central Fixed Asset Service & Lifecycle Engine
 * Tasks: BE-129, BE-130, BE-131 (Implement Asset Lifecycle API)
 * SRS Traceability: Section 9 (Fixed Assets Register), Clarification Register C-11
 */

import { prisma } from '../../config/database.js'
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js'

/**
 * Generate sequential Asset Tag AST-YYYY-XXXXX (SRS C-11)
 * @returns {Promise<string>}
 */
export async function generateAssetTag() {
  const year = new Date().getFullYear()
  const count = await prisma.fixedAsset.count()
  const sequence = String(count + 1).padStart(5, '0')
  return `AST-${year}-${sequence}`
}

/**
 * Register a new Fixed Asset
 * @param {Object} data - { name, itemId, grnId, serialNumber, category, custodianId, departmentId, locationId, purchaseDate, purchaseCost, currentValue, notes }
 * @returns {Promise<Object>} Created FixedAsset record
 */
export async function createAsset({
  name,
  itemId,
  grnId,
  serialNumber,
  category = 'GENERAL',
  custodianId,
  departmentId,
  locationId,
  purchaseDate,
  purchaseCost,
  currentValue,
  notes,
}) {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Asset name is required')
  }

  const assetTag = await generateAssetTag()

  const asset = await prisma.fixedAsset.create({
    data: {
      assetTag,
      name,
      itemId: itemId || null,
      grnId: grnId || null,
      serialNumber: serialNumber || null,
      category,
      status: 'REGISTERED',
      custodianId: custodianId || null,
      departmentId: departmentId || null,
      locationId: locationId || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchaseCost: purchaseCost !== undefined ? parseFloat(String(purchaseCost)) : null,
      currentValue: currentValue !== undefined ? parseFloat(String(currentValue)) : (purchaseCost !== undefined ? parseFloat(String(purchaseCost)) : null),
      notes: notes || null,
    },
    include: {
      item: { select: { id: true, name: true, code: true } },
      grn: { select: { id: true, grnNumber: true } },
      custodian: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
      location: { select: { id: true, name: true, code: true } },
    },
  })

  return asset
}

/**
 * Get Fixed Asset by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getAssetById(id) {
  const asset = await prisma.fixedAsset.findUnique({
    where: { id },
    include: {
      item: { select: { id: true, name: true, code: true } },
      grn: { select: { id: true, grnNumber: true } },
      custodian: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
      location: { select: { id: true, name: true, code: true } },
    },
  })

  if (!asset) {
    throw new NotFoundError(`Fixed Asset with ID '${id}' not found`)
  }

  return asset
}

/**
 * List Fixed Assets with filters and pagination
 * @param {Object} [filters={}] - { status, custodianId, departmentId, search, page, limit }
 * @returns {Promise<Object>} { assets, total, page, totalPages }
 */
export async function listAssets(filters = {}) {
  const { status, custodianId, departmentId, search, page = 1, limit = 10 } = filters

  const where = {
    ...(status && { status }),
    ...(custodianId && { custodianId }),
    ...(departmentId && { departmentId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  const skip = (pageNum - 1) * limitNum

  const [assets, total] = await Promise.all([
    prisma.fixedAsset.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        custodian: { select: { id: true, fullName: true } },
        department: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true } },
      },
    }),
    prisma.fixedAsset.count({ where }),
  ])

  return {
    assets,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Assign / Transfer Asset Custody
 * @param {Object} params - { id, custodianId, departmentId, locationId, notes }
 * @returns {Promise<Object>} Updated FixedAsset record
 */
export async function assignCustody({ id, custodianId, departmentId, locationId, notes }) {
  const asset = await getAssetById(id)

  if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
    throw new ConflictError(`Cannot assign custody for asset in state '${asset.status}'`)
  }

  return prisma.fixedAsset.update({
    where: { id },
    data: {
      status: 'IN_SERVICE',
      custodianId,
      ...(departmentId && { departmentId }),
      ...(locationId && { locationId }),
      ...(notes && { notes }),
    },
    include: {
      custodian: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
      location: { select: { id: true, name: true, code: true } },
    },
  })
}

/**
 * Update Fixed Asset Lifecycle Status (BE-131)
 * Statuses: REGISTERED | IN_SERVICE | UNDER_MAINTENANCE | DISPOSED | WRITTEN_OFF
 * @param {Object} params - { id, status, notes }
 * @returns {Promise<Object>} Updated FixedAsset record
 */
export async function updateAssetStatus({ id, status, notes }) {
  const asset = await getAssetById(id)

  const validStatuses = ['REGISTERED', 'IN_SERVICE', 'UNDER_MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF']
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid asset status '${status}'. Allowed: ${validStatuses.join(', ')}`)
  }

  if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
    throw new ConflictError(`Fixed Asset is already '${asset.status}' and cannot transition status further`)
  }

  return prisma.fixedAsset.update({
    where: { id },
    data: {
      status,
      ...(notes && { notes }),
    },
    include: {
      custodian: { select: { id: true, fullName: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  })
}
