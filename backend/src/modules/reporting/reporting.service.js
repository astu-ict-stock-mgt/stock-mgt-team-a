/**
 * Cross-Module Reporting Service
 * Task: BE-149 (Implement Reporting Service)
 * SRS Traceability: FR-42, Section 12.1 (Reports)
 * Depends on: BE-085, BE-098, BE-105, BE-116, BE-123, BE-130, BE-137, BE-144
 *
 * Pure read queries only — no business-rule side effects, no writes, no
 * status transitions. Mirrors the pagination/filter shape already used by
 * every list*() function seen in this codebase (requisition.service.js,
 * return.service.js, transfer.service.js): { page, limit } in,
 * { <items>, total, page, totalPages } out.
 *
 * SOURCING NOTES (what's real vs assumed in this file):
 * - Stock levels / movement / bin movement / valuation / issue (SIV side):
 *   queried DIRECTLY against prisma models whose exact schema is
 *   confirmed (stockCard, stockCardTransaction, binTransaction, sivs) —
 *   NOT via BE-085's actual service, which was never supplied. Reading
 *   the real tables directly is lower-risk than guessing BE-085's
 *   internal function signatures for a "critical path" ledger service.
 * - Requisitions: delegates to the real listRequisitions() from
 *   requisition.service.js (BE-098, supplied).
 * - Returns: delegates to listReturns() from return.service.js (BE-116,
 *   supplied). Path assumed as ../returns/return.service.js — not
 *   confirmed, only the file's content was pasted, not its location.
 * - Transfers: delegates to listTransfers() from transfer.service.js
 *   (BE-123, supplied). Same path caveat.
 * - Disposals: delegates to listDisposalRequests() from
 *   disposal.service.js (BE-137) — the function NAME is confirmed (it's
 *   imported by the real disposal.controller.js you pasted), but the
 *   file's own implementation and exact path were never shown.
 * - Assets: delegates to an ASSUMED listAssets() in an ASSUMED
 *   asset.service.js — only the Zod DTO (BE-130) was supplied, no
 *   service file and no confirmed export name. Flag and correct once
 *   the real file is available.
 * - Stock-take: BE-144 is still Open (not built). getStockTakeReport()
 *   fails loudly rather than returning fabricated data — do not stub
 *   this with fake numbers.
 */
import { prisma } from '../../config/database.js'
import { ValidationError, ConflictError } from '../../utils/errors.js'
import { listRequisitions } from '../requisitions/requisition.service.js'
import { listReturns } from '../returns/return.service.js'
import { listTransfers } from '../transfers/transfer.service.js'
import { listDisposalRequests } from '../disposals/disposal.service.js'
// ASSUMPTION: real file/export not supplied — see SOURCING NOTES above.
import { listAssets } from '../assets/asset.service.js'

function paginate(page, limit) {
  const pageNum = parseInt(String(page), 10) || 1
  const limitNum = parseInt(String(limit), 10) || 10
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum }
}

function paginatedResult(itemsKey, items, total, pageNum, limitNum) {
  return {
    [itemsKey]: items,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

function dateRangeWhere(dateFrom, dateTo, field = 'createdAt') {
  if (!dateFrom && !dateTo) return {}
  const range = {}
  if (dateFrom) {
    const from = new Date(dateFrom)
    if (Number.isNaN(from.getTime())) throw new ValidationError('dateFrom is not a valid date')
    range.gte = from
  }
  if (dateTo) {
    const to = new Date(dateTo)
    if (Number.isNaN(to.getTime())) throw new ValidationError('dateTo is not a valid date')
    range.lte = to
  }
  return { [field]: range }
}

/**
 * FR-45 / current stock report — one row per item/store combination.
 * @param {Object} filters - { storeId, itemId, page, limit }
 */
export async function getStockLevelsReport(filters = {}) {
  const { storeId, itemId, page = 1, limit = 10 } = filters
  const { pageNum, limitNum, skip } = paginate(page, limit)

  const where = {
    ...(storeId && { storeId }),
    ...(itemId && { itemId }),
  }

  const [stockCards, total] = await Promise.all([
    prisma.stockCard.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { lastMovementAt: 'desc' },
      include: {
        item: { select: { id: true, name: true, code: true } },
        store: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.stockCard.count({ where }),
  ])

  return paginatedResult('stockLevels', stockCards, total, pageNum, limitNum)
}

/**
 * Stock movement report — SRC transaction history (BR-07: direction,
 * quantity, item, store/location, supporting reference).
 * @param {Object} filters - { storeId, itemId, transactionType, dateFrom, dateTo, page, limit }
 */
export async function getStockMovementReport(filters = {}) {
  const { storeId, itemId, transactionType, dateFrom, dateTo, page = 1, limit = 10 } = filters
  const { pageNum, limitNum, skip } = paginate(page, limit)

  const where = {
    ...(transactionType && { transactionType }),
    ...dateRangeWhere(dateFrom, dateTo),
    stockCard: {
      ...(storeId && { storeId }),
      ...(itemId && { itemId }),
    },
  }

  const [movements, total] = await Promise.all([
    prisma.stockCardTransaction.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        stockCard: {
          include: {
            item: { select: { id: true, name: true, code: true } },
            store: { select: { id: true, name: true, code: true } },
          },
        },
        createdByUser: { select: { id: true, fullName: true } },
      },
    }),
    prisma.stockCardTransaction.count({ where }),
  ])

  return paginatedResult('movements', movements, total, pageNum, limitNum)
}

/**
 * Bin card / bin-level movement report.
 * @param {Object} filters - { locationId, itemId, dateFrom, dateTo, page, limit }
 */
export async function getBinMovementReport(filters = {}) {
  const { locationId, itemId, dateFrom, dateTo, page = 1, limit = 10 } = filters
  const { pageNum, limitNum, skip } = paginate(page, limit)

  const where = {
    ...dateRangeWhere(dateFrom, dateTo),
    binCard: {
      ...(locationId && { locationId }),
      ...(itemId && { itemId }),
    },
  }

  const [movements, total] = await Promise.all([
    prisma.binTransaction.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        binCard: {
          include: {
            item: { select: { id: true, name: true, code: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
        createdByUser: { select: { id: true, fullName: true } },
      },
    }),
    prisma.binTransaction.count({ where }),
  ])

  return paginatedResult('movements', movements, total, pageNum, limitNum)
}

/**
 * Inventory valuation report.
 *
 * NEEDS CLARIFICATION (SRS C-13, not resolved by this function): this
 * reads stockCard.averageCost * quantity as the valuation figure. C-13
 * asks whether FIFO applies only to financial valuation or also to which
 * physical units get selected on issue — BE-085's actual costing logic
 * (how averageCost is computed/maintained) was never supplied, so this
 * function trusts whatever value is already stored rather than
 * recomputing a FIFO cost itself. If BE-085 uses a different valuation
 * method internally, this report will silently disagree with it — flag
 * against C-13 before this is relied on for financial reporting.
 *
 * @param {Object} filters - { storeId, itemId }
 */
export async function getValuationReport(filters = {}) {
  const { storeId, itemId } = filters

  const where = {
    ...(storeId && { storeId }),
    ...(itemId && { itemId }),
  }

  const stockCards = await prisma.stockCard.findMany({
    where,
    include: {
      item: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, name: true, code: true } },
    },
  })

  const lines = stockCards.map((card) => ({
    itemId: card.itemId,
    item: card.item,
    storeId: card.storeId,
    store: card.store,
    quantity: card.quantity,
    averageCost: card.averageCost,
    totalValue:
      card.averageCost != null ? Number(card.averageCost) * card.quantity : null,
  }))

  const totalValue = lines.reduce((sum, line) => sum + (line.totalValue ?? 0), 0)

  return { lines, totalValue, valuationMethod: 'AVERAGE_COST_STORED' }
}

/**
 * Requisition & issue report — combines requisition status with the SIVs
 * drawn from them. Queries `sivs` directly (schema confirmed via BE-103)
 * since no siv.service.js list function has been supplied yet.
 * @param {Object} filters - { status, storeId, departmentId, dateFrom, dateTo, page, limit }
 */
export async function getRequisitionIssueReport(filters = {}) {
  const { status, storeId, departmentId, dateFrom, dateTo, page = 1, limit = 10 } = filters

  const requisitions = await listRequisitions({ status, storeId, departmentId, page, limit })

  const { pageNum, limitNum, skip } = paginate(page, limit)
  const sivWhere = {
    ...(storeId && { storeId }),
    ...dateRangeWhere(dateFrom, dateTo, 'issueDate'),
  }

  const [sivs, sivTotal] = await Promise.all([
    prisma.sIV.findMany({
      where: sivWhere,
      skip,
      take: limitNum,
      orderBy: { issueDate: 'desc' },
      include: {
        requisition: { select: { id: true, requisitionNumber: true } },
        store: { select: { id: true, name: true, code: true } },
        lines: { include: { item: { select: { id: true, name: true, code: true } } } },
      },
    }),
    prisma.sIV.count({ where: sivWhere }),
  ])

  return {
    requisitions,
    issues: paginatedResult('sivs', sivs, sivTotal, pageNum, limitNum),
  }
}

/**
 * Returns (SRN) report — delegates to the real return.service.js.
 * @param {Object} filters - { status, storeId, returnedBy, page, limit }
 */
export async function getReturnsReport(filters = {}) {
  return listReturns(filters)
}

/**
 * Transfers report — delegates to the real transfer.service.js.
 * @param {Object} filters - { status, transferType, sourceStoreId, destinationStoreId, page, limit }
 */
export async function getTransfersReport(filters = {}) {
  return listTransfers(filters)
}

/**
 * Fixed asset register report.
 *
 * ASSUMPTION: delegates to listAssets() in an assumed asset.service.js —
 * only BE-130's Zod DTO was supplied, not the service itself. Replace
 * the import at the top of this file once the real service/export name
 * is available.
 * @param {Object} filters
 */
export async function getAssetsReport(filters = {}) {
  return listAssets(filters)
}

/**
 * Disposal report — delegates to the real disposal.service.js
 * (function name confirmed via disposal.controller.js's import, BE-137).
 * @param {Object} filters
 */
export async function getDisposalReport(filters = {}) {
  return listDisposalRequests(filters)
}

/**
 * Stock-take report — BLOCKED. BE-144 (Implement Stock-Taking
 * Service/API) is still an open ticket; no stock_takes /
 * stock_take_lines schema or service exists yet to query. This throws
 * rather than returning fabricated or empty-looking data that could be
 * mistaken for "no stock-take activity" instead of "not built yet."
 */
export async function getStockTakeReport() {
  throw new ConflictError(
    'Stock-take reporting is unavailable: BE-144 (Stock-Taking Service/API) has not been implemented yet.'
  )
}
