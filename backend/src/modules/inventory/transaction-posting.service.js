import { PrismaClient } from '@prisma/client';
import { ValidationError } from '../../utils/errors.js';

const prisma = new PrismaClient();

class TransactionPostingEngine {
  async postTransaction(transactionData) {
    const {
      itemId,
      storeId,
      transactionType,
      quantity,
      referenceType,
      referenceId,
      referenceNumber,
      notes,
      createdBy,
      locationId,
    } = transactionData;

    return await prisma.$transaction(async (tx) => {
      // 1. Validate quantity
      if (quantity <= 0) {
        throw new ValidationError('Transaction quantity must be positive');
      }

      // 2. For outbound transactions, check available balance
      const outboundTypes = ['ISSUE', 'TRANSFER_OUT', 'DISPOSAL'];
      if (outboundTypes.includes(transactionType)) {
        const stockCard = await tx.stockCard.findUnique({
          where: {
            itemId_storeId: { itemId, storeId },
          },
        });

        if (!stockCard || stockCard.availableQty < quantity) {
          throw new ValidationError(
            `Insufficient stock. Available: ${stockCard?.availableQty || 0}, Requested: ${quantity}`
          );
        }
      }

      // 3. Get or create stock card
      let stockCard = await tx.stockCard.findUnique({
        where: {
          itemId_storeId: { itemId, storeId },
        },
      });

      if (!stockCard) {
        stockCard = await tx.stockCard.create({
          data: {
            itemId,
            storeId,
            quantity: 0,
            reservedQty: 0,
            availableQty: 0,
          },
        });
      }

      // 4. Calculate new quantities
      const inboundTypes = ['RECEIPT', 'TRANSFER_IN', 'RETURN'];
      const outboundTransactionTypes = ['ISSUE', 'TRANSFER_OUT', 'DISPOSAL'];

      let newQuantity = stockCard.quantity;
      let newAvailableQty = stockCard.availableQty;

      if (inboundTypes.includes(transactionType)) {
        newQuantity += quantity;
        newAvailableQty += quantity;
      } else if (outboundTransactionTypes.includes(transactionType)) {
        newQuantity -= quantity;
        newAvailableQty -= quantity;
      } else if (transactionType === 'ADJUSTMENT') {
        // Adjustment can be positive or negative
        newQuantity += quantity;
        newAvailableQty += quantity;
      }

      // 5. Update stock card
      await tx.stockCard.update({
        where: { id: stockCard.id },
        data: {
          quantity: newQuantity,
          availableQty: newAvailableQty,
          lastMovementAt: new Date(),
        },
      });

      // 6. Create stock card transaction
      const stockTransaction = await tx.stockCardTransaction.create({
        data: {
          stockCardId: stockCard.id,
          transactionType,
          quantity,
          referenceType,
          referenceId,
          referenceNumber,
          notes,
          createdBy,
        },
      });

      // 7. Update bin card if location provided
      if (locationId) {
        let binCard = await tx.binCard.findUnique({
          where: {
            itemId_locationId: { itemId, locationId },
          },
        });

        if (!binCard) {
          binCard = await tx.binCard.create({
            data: {
              itemId,
              locationId,
              quantity: 0,
            },
          });
        }

        let newBinQuantity = binCard.quantity;
        if (inboundTypes.includes(transactionType)) {
          newBinQuantity += quantity;
        } else if (outboundTransactionTypes.includes(transactionType)) {
          newBinQuantity -= quantity;
        } else if (transactionType === 'ADJUSTMENT') {
          newBinQuantity += quantity;
        }

        await tx.binCard.update({
          where: { id: binCard.id },
          data: {
            quantity: newBinQuantity,
            lastMovementAt: new Date(),
          },
        });

        await tx.binTransaction.create({
          data: {
            binCardId: binCard.id,
            transactionType,
            quantity,
            referenceType,
            referenceId,
            referenceNumber,
            notes,
            createdBy,
          },
        });
      }

      return {
        stockTransaction,
        newBalance: newQuantity,
        newAvailableBalance: newAvailableQty,
      };
    });
  }

  async getStockBalance(itemId, storeId) {
    const stockCard = await prisma.stockCard.findUnique({
      where: {
        itemId_storeId: { itemId, storeId },
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
      },
    });

    if (!stockCard) {
      return {
        itemId,
        storeId,
        quantity: 0,
        reservedQty: 0,
        availableQty: 0,
        averageCost: null,
        lastMovementAt: null,
      };
    }

    return stockCard;
  }

  async getBinBalance(itemId, locationId) {
    const binCard = await prisma.binCard.findUnique({
      where: {
        itemId_locationId: { itemId, locationId },
      },
      include: {
        item: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true } },
      },
    });

    if (!binCard) {
      return {
        itemId,
        locationId,
        quantity: 0,
        lastMovementAt: null,
      };
    }

    return binCard;
  }

  async getTransactionHistory(filters = {}) {
    const { itemId, storeId, transactionType, startDate, endDate, limit = 100 } = filters;

    const where = {};

    if (itemId || storeId) {
      const stockCards = await prisma.stockCard.findMany({
        where: {
          ...(itemId && { itemId }),
          ...(storeId && { storeId }),
        },
        select: { id: true },
      });
      where.stockCardId = { in: stockCards.map(sc => sc.id) };
    }

    if (transactionType) where.transactionType = transactionType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return prisma.stockCardTransaction.findMany({
      where,
      include: {
        stockCard: {
          include: {
            item: { select: { id: true, code: true, name: true } },
            store: { select: { id: true, code: true, name: true } },
          },
        },
        createdByUser: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default new TransactionPostingEngine();
