/**
 * Transfer Source / Destination Validation Service
 * Task: BE-127 (Implement Transfer Source/Destination Validation)
 * Depends on: BE-126, BE-088, BE-089
 * SRS Traceability: Section 10.1 (Core Entities),
 *                   FR-35 (material transfer requests),
 *                   FR-36 (transfer approval/rejection and execution),
 *                   BR-06 (non-negative balances),
 *                   BR-15 (atomic transfer movement),
 *                   P-3 (non-negative balances default),
 *                   P-5 (idempotent finalisation),
 *                   Clarification C-10 (transfer policy)
 */

import { prisma } from '../../config/database.js'
import {
  NotFoundError,
  ValidationError,
  InsufficientStockError,
  InvalidStatusError,
  InvalidSourceError,
  InvalidDestinationError,
  DuplicatePostingError,
} from '../../utils/errors.js'

export class TransferValidationService {
  /**
   * Validate lifecycle preconditions and authorising state
   * @param {Object} transferRequest
   */
  static validatePreconditions(transferRequest) {
    if (!transferRequest) {
      throw new NotFoundError('Transfer request not found')
    }

    // Idempotency check: duplicate posting prevention (P-5, BR-11)
    if (transferRequest.status === 'COMPLETED') {
      throw new DuplicatePostingError(
        `Transfer request ${transferRequest.transferNumber || transferRequest.id} has already been executed/completed`
      )
    }

    // Status guard: only APPROVED transfers may be posted (P-5, BR-15)
    if (transferRequest.status !== 'APPROVED') {
      throw new InvalidStatusError(
        `Transfer request must be in APPROVED status to post (current status: ${transferRequest.status})`
      )
    }

    // Transfer must have at least one line item
    if (!transferRequest.lines || transferRequest.lines.length === 0) {
      throw new ValidationError('Transfer request must contain at least one item line to execute')
    }
  }

  /**
   * Validate source and destination stores, locations, and distinctness
   * @param {Object} transferRequest
   * @param {Object} [dbClient=prisma] - Prisma client or transaction client
   */
  static async validateSourceAndDestination(transferRequest, dbClient = prisma) {
    const {
      transferType,
      sourceStoreId,
      destinationStoreId,
      sourceLocationId,
      destinationLocationId,
    } = transferRequest

    // 1. Store Validation (for store-level transfers)
    if (transferType === 'STORE_TO_STORE' || sourceStoreId || destinationStoreId) {
      if (!sourceStoreId) {
        throw new InvalidSourceError('Source store is required for store transfer')
      }
      if (!destinationStoreId) {
        throw new InvalidDestinationError('Destination store is required for store transfer')
      }

      // Distinctness check: source !== destination
      if (sourceStoreId === destinationStoreId) {
        throw new InvalidDestinationError(
          'Source store and destination store must be distinct'
        )
      }

      // Check source store existence and active status
      const sourceStore =
        transferRequest.sourceStore ||
        (await dbClient.store.findUnique({ where: { id: sourceStoreId } }))
      if (!sourceStore || sourceStore.status !== 'ACTIVE') {
        throw new InvalidSourceError(
          `Source store ${sourceStore?.name || sourceStoreId} is inactive or not found`
        )
      }

      // Check destination store existence and active status
      const destinationStore =
        transferRequest.destinationStore ||
        (await dbClient.store.findUnique({ where: { id: destinationStoreId } }))
      if (!destinationStore || destinationStore.status !== 'ACTIVE') {
        throw new InvalidDestinationError(
          `Destination store ${destinationStore?.name || destinationStoreId} is inactive or not found`
        )
      }
    }

    // 2. Bin Location Validation (for bin-level transfers)
    if (transferType === 'BIN_TO_BIN' || (sourceLocationId && destinationLocationId)) {
      if (sourceLocationId && destinationLocationId && sourceLocationId === destinationLocationId) {
        throw new InvalidDestinationError(
          'Source bin location and destination bin location must be distinct'
        )
      }

      if (sourceLocationId) {
        const sourceLoc =
          transferRequest.sourceLocation ||
          (await dbClient.location.findUnique({ where: { id: sourceLocationId } }))
        if (!sourceLoc || sourceLoc.status !== 'ACTIVE') {
          throw new InvalidSourceError(
            `Source location ${sourceLoc?.name || sourceLocationId} is inactive or not found`
          )
        }
      }

      if (destinationLocationId) {
        const destLoc =
          transferRequest.destinationLocation ||
          (await dbClient.location.findUnique({ where: { id: destinationLocationId } }))
        if (!destLoc || destLoc.status !== 'ACTIVE') {
          throw new InvalidDestinationError(
            `Destination location ${destLoc?.name || destinationLocationId} is inactive or not found`
          )
        }
      }
    }
  }

  /**
   * Validate stock availability at source store and source bin (BE-088, BE-089)
   * Ensures non-negative balances (BR-06, P-3)
   * @param {Object} transferRequest
   * @param {Object} [dbClient=prisma] - Prisma client or transaction client
   */
  static async validateSourceAvailability(transferRequest, dbClient = prisma) {
    const { sourceStoreId, lines } = transferRequest

    for (const line of lines) {
      const { itemId, quantity, sourceLocationId: lineSourceLocId } = line

      // 1. Positive quantity check
      if (!quantity || quantity <= 0) {
        throw new ValidationError(
          `Transfer quantity must be greater than zero for item ${line.item?.name || itemId}`
        )
      }

      // 2. Source Stock Card Availability Check (BE-088)
      if (sourceStoreId) {
        const stockCard = await dbClient.stockCard.findUnique({
          where: {
            uq_stock_card_item_store: {
              itemId,
              storeId: sourceStoreId,
            },
          },
          include: {
            item: { select: { id: true, code: true, name: true } },
          },
        })

        const availableQty = stockCard?.availableQty ?? 0
        if (!stockCard || availableQty < quantity) {
          const itemLabel = stockCard?.item
            ? `"${stockCard.item.name}" (${stockCard.item.code})`
            : `ID ${itemId}`
          throw new InsufficientStockError(
            `Insufficient stock for item ${itemLabel} at source store. Available: ${availableQty}, Requested: ${quantity}`
          )
        }
      }

      // 3. Source Bin Card Availability Check (BE-089)
      const effectiveSourceLocId = lineSourceLocId || transferRequest.sourceLocationId
      if (effectiveSourceLocId) {
        const binCard = await dbClient.binCard.findUnique({
          where: {
            uq_bin_card_item_location: {
              itemId,
              locationId: effectiveSourceLocId,
            },
          },
          include: {
            item: { select: { id: true, code: true, name: true } },
            location: { select: { id: true, code: true, name: true } },
          },
        })

        const binQty = binCard?.quantity ?? 0
        if (!binCard || binQty < quantity) {
          const itemLabel = binCard?.item
            ? `"${binCard.item.name}" (${binCard.item.code})`
            : `ID ${itemId}`
          const binLabel = binCard?.location
            ? `bin "${binCard.location.name}" (${binCard.location.code})`
            : `location ID ${effectiveSourceLocId}`
          throw new InsufficientStockError(
            `Insufficient stock for item ${itemLabel} at source ${binLabel}. Available: ${binQty}, Requested: ${quantity}`
          )
        }
      }
    }
  }

  /**
   * Complete validation pipeline before allowing atomic posting (BE-126)
   * @param {string|Object} transferRequestOrId
   * @param {Object} [dbClient=prisma]
   * @returns {Promise<Object>} Validated transfer request entity with relations
   */
  static async validateTransferExecution(transferRequestOrId, dbClient = prisma) {
    let transferRequest = transferRequestOrId

    // If string ID was passed, fetch the full transfer entity with relations
    if (typeof transferRequestOrId === 'string') {
      transferRequest = await dbClient.transferRequest.findUnique({
        where: { id: transferRequestOrId },
        include: {
          lines: {
            include: {
              item: { select: { id: true, code: true, name: true } },
            },
          },
          sourceStore: true,
          destinationStore: true,
          sourceLocation: true,
          destinationLocation: true,
        },
      })
    }

    // Step 1: Validate lifecycle status and preconditions
    TransferValidationService.validatePreconditions(transferRequest)

    // Step 2: Validate source & destination stores and locations
    await TransferValidationService.validateSourceAndDestination(transferRequest, dbClient)

    // Step 3: Validate source stock availability (stock cards and bin cards)
    await TransferValidationService.validateSourceAvailability(transferRequest, dbClient)

    return {
      isValid: true,
      transferRequest,
    }
  }
}

export default TransferValidationService
