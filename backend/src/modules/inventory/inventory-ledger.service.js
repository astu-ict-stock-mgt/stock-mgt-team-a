import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class InventoryLedgerService {
  async getStockByStore(storeId, filters = {}) {
    const { categoryId, search, lowStock } = filters;

    const where = {
      storeId,
      ...(categoryId && { item: { categoryId } }),
      ...(search && {
        item: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const stockCards = await prisma.stockCard.findMany({
      where,
      include: {
        item: {
          include: {
            category: { select: { id: true, code: true, name: true } },
            unit: { select: { id: true, code: true, name: true, symbol: true } },
          },
        },
        store: { select: { id: true, code: true, name: true } },
      },
      orderBy: { item: { name: 'asc' } },
    });

    if (lowStock) {
      return stockCards.filter(sc => 
        sc.item.reorderPoint && sc.availableQty <= sc.item.reorderPoint
      );
    }

    return stockCards;
  }

  async getStockByItem(itemId) {
    return prisma.stockCard.findMany({
      where: { itemId },
      include: {
        item: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
      },
      orderBy: { store: { name: 'asc' } },
    });
  }

  async getStockValue(storeId) {
    const stockCards = await prisma.stockCard.findMany({
      where: { storeId },
      include: {
        item: { select: { id: true, code: true, name: true, unitCost: true } },
      },
    });

    let totalValue = 0;
    const breakdown = stockCards.map(sc => {
      const value = sc.quantity * (sc.item.unitCost || 0);
      totalValue += value;
      return {
        itemId: sc.item.id,
        itemCode: sc.item.code,
        itemName: sc.item.name,
        quantity: sc.quantity,
        unitCost: sc.item.unitCost,
        totalValue: value,
      };
    });

    return {
      storeId,
      totalValue,
      breakdown,
    };
  }

  async getLowStockItems(storeId) {
    const stockCards = await prisma.stockCard.findMany({
      where: {
        storeId,
        item: {
          reorderPoint: { not: null },
        },
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            reorderPoint: true,
            minimumStock: true,
            unit: { select: { symbol: true } },
          },
        },
      },
    });

    return stockCards.filter(sc => sc.availableQty <= sc.item.reorderPoint);
  }

  async getMovementSummary(storeId, startDate, endDate) {
    const transactions = await prisma.stockCardTransaction.findMany({
      where: {
        stockCard: { storeId },
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        stockCard: {
          include: { item: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    const summary = {};
    transactions.forEach(t => {
      const key = t.transactionType;
      if (!summary[key]) {
        summary[key] = { count: 0, totalQuantity: 0 };
      }
      summary[key].count++;
      summary[key].totalQuantity += t.quantity;
    });

    return summary;
  }
}

export default new InventoryLedgerService();
