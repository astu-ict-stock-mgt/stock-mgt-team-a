import { prisma } from '../../config/database.js';
import { ValidationError } from '../../utils/errors.js';

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
      // ADJUSTMENT transactions accept signed quantities (positive = increase, negative = decrease)
      if (transactionType !== 'ADJUSTMENT' && quantity <= 0) {
        throw new ValidationError('Transaction quantity must be positive');
      }
      if (transactionType === 'ADJUSTMENT' && quantity === 0) {
        throw new ValidationError('Adjustment quantity must not be zero');
      }

      // 2. For outbound transactions (and negative adjustments), check available balance
      const outboundTypes = ['ISSUE', 'TRANSFER_OUT', 'DISPOSAL'];
      const isNegativeAdjustment = transactionType === 'ADJUSTMENT' && quantity < 0;
      if (outboundTypes.includes(transactionType) || isNegativeAdjustment) {
        const stockCard = await tx.stockCard.findUnique({
          where: {
            uq_stock_card_item_store: { itemId, storeId },
          },
        });

        const requiredQty = Math.abs(quantity);
        if (!stockCard || stockCard.availableQty < requiredQty) {
          throw new ValidationError(
            `Insufficient stock. Available: ${stockCard?.availableQty || 0}, Requested: ${requiredQty}`
          );
        }
      }

      // 3. Get or create stock card
      let stockCard = await tx.stockCard.findUnique({
        where: {
          uq_stock_card_item_store: { itemId, storeId },
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
        // Adjustment uses signed quantity: positive = increase, negative = decrease
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

      // 6. Create stock card transaction (store absolute quantity for display, signed for balance)
      const stockTransaction = await tx.stockCardTransaction.create({
        data: {
          stockCardId: stockCard.id,
          transactionType,
          quantity: Math.abs(quantity),
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
            quantity: Math.abs(quantity),
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
        uq_stock_card_item_store: { itemId, storeId },
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
    const { itemId, storeId, transactionType, startDate, endDate, limit: rawLimit } = filters;
    const limit = Math.min(100, Math.max(1, parseInt(String(rawLimit), 10) || 100));

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
