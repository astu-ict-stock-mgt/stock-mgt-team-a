/**
 * Transfer Execution Posting Service
 * Tasks: BE-126 (Implement Transfer Execution Posting) & BE-127 (Transfer Source/Destination Validation)
 * SRS Traceability: Section 10.1 (Core Entities),
 *                   FR-35 (material transfer requests),
 *                   FR-36 (transfer approval/rejection and execution),
 *                   BR-15 (atomic transfer posting: decrease source, increase destination),
 *                   BR-06 (non-negative balances),
 *                   P-2 (atomic transaction),
 *                   P-4 (movement record mandatory),
 *                   P-5 (idempotent finalisation)
 */

import { prisma } from '../../config/database.js'
import { TransferValidationService } from './transfer-validation.service.js'

export class TransferPostingService {
  /**
   * Post approved transfer execution atomically through the posting engine
   * Calls TransferValidationService (BE-127) before applying movements (BR-15, P-2)
   *
   * @param {string} transferRequestId - ID of the transfer request to post
   * @param {string} executedByUserId - ID of the storekeeper / authorized user executing the transfer
   * @returns {Promise<Object>} Summary of posted transfer transactions and updated balances
   */
  static async executeTransferPosting(transferRequestId, executedByUserId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch Transfer Request with lines and relations inside the transaction
      const transferRequest = await tx.transferRequest.findUnique({
        where: { id: transferRequestId },
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

      // 2. Validate preconditions, source availability, destination validity & quantities (BE-127)
      await TransferValidationService.validateTransferExecution(transferRequest, tx)

      const {
        transferNumber,
        sourceStoreId,
        destinationStoreId,
        sourceLocationId,
        destinationLocationId,
        lines,
      } = transferRequest

      const movements = []

      // 3. Process each line item: Atomic OUT (source) and IN (destination)
      for (const line of lines) {
        const { itemId, quantity, sourceLocationId: lineSourceLocId, destinationLocationId: lineDestLocId } = line
        const effectiveSourceLocId = lineSourceLocId || sourceLocationId
        const effectiveDestLocId = lineDestLocId || destinationLocationId

        // 3.1 --- SOURCE LEG (OUT) ---
        // Fetch or create source stock card
        let sourceStockCard = await tx.stockCard.findUnique({
          where: {
            uq_stock_card_item_store: {
              itemId,
              storeId: sourceStoreId,
            },
          },
        })

        if (!sourceStockCard) {
          sourceStockCard = await tx.stockCard.create({
            data: {
              itemId,
              storeId: sourceStoreId,
              quantity: 0,
              availableQty: 0,
            },
          })
        }

        const newSourceQty = sourceStockCard.quantity - quantity
        const newSourceAvail = sourceStockCard.availableQty - quantity

        // Update source stock card balance
        await tx.stockCard.update({
          where: { id: sourceStockCard.id },
          data: {
            quantity: newSourceQty,
            availableQty: newSourceAvail,
            lastMovementAt: new Date(),
          },
        })

        // Record source stock card transaction (TRANSFER_OUT)
        const sourceTx = await tx.stockCardTransaction.create({
          data: {
            stockCardId: sourceStockCard.id,
            transactionType: 'TRANSFER_OUT',
            quantity: quantity,
            referenceType: 'TRANSFER_REQUEST',
            referenceId: transferRequest.id,
            referenceNumber: transferNumber,
            notes: `Transfer out to destination store ${transferRequest.destinationStore?.code || destinationStoreId}`,
            createdBy: executedByUserId,
          },
        })

        // Update source bin card if location specified
        if (effectiveSourceLocId) {
          const sourceBinCard = await tx.binCard.findUnique({
            where: {
              uq_bin_card_item_location: {
                itemId,
                locationId: effectiveSourceLocId,
              },
            },
          })

          if (sourceBinCard) {
            await tx.binCard.update({
              where: { id: sourceBinCard.id },
              data: {
                quantity: sourceBinCard.quantity - quantity,
                lastMovementAt: new Date(),
              },
            })

            await tx.binTransaction.create({
              data: {
                binCardId: sourceBinCard.id,
                transactionType: 'TRANSFER_OUT',
                quantity: quantity,
                referenceType: 'TRANSFER_REQUEST',
                referenceId: transferRequest.id,
                referenceNumber: transferNumber,
                createdBy: executedByUserId,
              },
            })
          }
        }

        // 3.2 --- DESTINATION LEG (IN) ---
        // Fetch or create destination stock card
        let destStockCard = await tx.stockCard.findUnique({
          where: {
            uq_stock_card_item_store: {
              itemId,
              storeId: destinationStoreId,
            },
          },
        })

        if (!destStockCard) {
          destStockCard = await tx.stockCard.create({
            data: {
              itemId,
              storeId: destinationStoreId,
              quantity: 0,
              availableQty: 0,
            },
          })
        }

        const newDestQty = destStockCard.quantity + quantity
        const newDestAvail = destStockCard.availableQty + quantity

        // Update destination stock card balance
        await tx.stockCard.update({
          where: { id: destStockCard.id },
          data: {
            quantity: newDestQty,
            availableQty: newDestAvail,
            lastMovementAt: new Date(),
          },
        })

        // Record destination stock card transaction (TRANSFER_IN)
        const destTx = await tx.stockCardTransaction.create({
          data: {
            stockCardId: destStockCard.id,
            transactionType: 'TRANSFER_IN',
            quantity: quantity,
            referenceType: 'TRANSFER_REQUEST',
            referenceId: transferRequest.id,
            referenceNumber: transferNumber,
            notes: `Transfer in from source store ${transferRequest.sourceStore?.code || sourceStoreId}`,
            createdBy: executedByUserId,
          },
        })

        // Update destination bin card if location specified
        if (effectiveDestLocId) {
          let destBinCard = await tx.binCard.findUnique({
            where: {
              uq_bin_card_item_location: {
                itemId,
                locationId: effectiveDestLocId,
              },
            },
          })

          if (!destBinCard) {
            destBinCard = await tx.binCard.create({
              data: {
                itemId,
                locationId: effectiveDestLocId,
                quantity: 0,
              },
            })
          }

          await tx.binCard.update({
            where: { id: destBinCard.id },
            data: {
              quantity: destBinCard.quantity + quantity,
              lastMovementAt: new Date(),
            },
          })

          await tx.binTransaction.create({
            data: {
              binCardId: destBinCard.id,
              transactionType: 'TRANSFER_IN',
              quantity: quantity,
              referenceType: 'TRANSFER_REQUEST',
              referenceId: transferRequest.id,
              referenceNumber: transferNumber,
              createdBy: executedByUserId,
            },
          })
        }

        movements.push({
          itemId,
          quantity,
          sourceTransactionId: sourceTx.id,
          destTransactionId: destTx.id,
          sourceNewBalance: newSourceQty,
          destNewBalance: newDestQty,
        })
      }

      // 4. Mark Transfer Request as COMPLETED
      const updatedTransfer = await tx.transferRequest.update({
        where: { id: transferRequestId },
        data: {
          status: 'COMPLETED',
          executedBy: executedByUserId,
          executedAt: new Date(),
        },
      })

      return {
        success: true,
        transferNumber: updatedTransfer.transferNumber,
        status: updatedTransfer.status,
        executedAt: updatedTransfer.executedAt,
        movements,
      }
    })
  }
}

export default TransferPostingService
