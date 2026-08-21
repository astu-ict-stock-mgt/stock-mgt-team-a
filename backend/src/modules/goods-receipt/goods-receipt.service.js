import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../../../utils/errors.js';

const prisma = new PrismaClient();

class GoodsReceiptService {
  async create(receiptData, userId) {
    const receiptNumber = await this.generateReceiptNumber();

    const receipt = await prisma.goodsReceipt.create({
      data: {
        receiptNumber,
        supplierId: receiptData.supplierId,
        storeId: receiptData.storeId,
        departmentId: receiptData.departmentId,
        purchaseOrderNumber: receiptData.purchaseOrderNumber,
        receivedBy: userId,
        notes: receiptData.notes,
        totalAmount: receiptData.totalAmount || 0,
        currency: receiptData.currency || 'ETB',
        lines: {
          create: receiptData.lines?.map(line => ({
            itemId: line.itemId,
            unitId: line.unitId,
            locationId: line.locationId,
            quantity: line.quantity,
            unitCost: line.unitCost,
            totalCost: line.quantity * line.unitCost,
            condition: line.condition,
            batchNumber: line.batchNumber,
            expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
            notes: line.notes,
          })) || [],
        },
      },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        department: { select: { id: true, code: true, name: true } },
        receivedByUser: { select: { id: true, fullName: true } },
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true } },
            unit: { select: { id: true, code: true, name: true, symbol: true } },
          },
        },
      },
    });

    return receipt;
  }

  async findAll(filters = {}) {
    const { status, supplierId, storeId, startDate, endDate, search } = filters;

    const where = {};

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (storeId) where.storeId = storeId;

    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) where.receivedDate.gte = new Date(startDate);
      if (endDate) where.receivedDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { purchaseOrderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.goodsReceipt.findMany({
      where,
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        store: { select: { id: true, code: true, name: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { receivedDate: 'desc' },
    });
  }

  async findById(id) {
    const receipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, code: true, name: true, contactPerson: true, phone: true } },
        store: { select: { id: true, code: true, name: true } },
        department: { select: { id: true, code: true, name: true } },
        receivedByUser: { select: { id: true, fullName: true } },
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true } },
            unit: { select: { id: true, code: true, name: true, symbol: true } },
            location: { select: { id: true, code: true, name: true } },
          },
        },
        evaluations: {
          include: {
            evaluator: { select: { id: true, fullName: true } },
          },
        },
        grn: true,
      },
    });

    if (!receipt) {
      throw new NotFoundError('Goods receipt not found');
    }

    return receipt;
  }

  async updateStatus(id, status, userId) {
    const receipt = await prisma.goodsReceipt.findUnique({ where: { id } });

    if (!receipt) {
      throw new NotFoundError('Goods receipt not found');
    }

    const validTransitions = {
      DRAFT: ['PENDING_EVALUATION'],
      PENDING_EVALUATION: ['EVALUATED', 'REJECTED'],
      EVALUATED: ['APPROVED'],
      APPROVED: [],
      REJECTED: [],
    };

    if (!validTransitions[receipt.status]?.includes(status)) {
      throw new ValidationError(`Cannot transition from ${receipt.status} to ${status}`);
    }

    return prisma.goodsReceipt.update({
      where: { id },
      data: { status },
    });
  }

  async generateReceiptNumber() {
    const today = new Date();
    const prefix = `GR-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const lastReceipt = await prisma.goodsReceipt.findFirst({
      where: {
        receiptNumber: { startsWith: prefix },
      },
      orderBy: { receiptNumber: 'desc' },
    });

    if (lastReceipt) {
      const sequence = parseInt(lastReceipt.receiptNumber.split('-')[2]) + 1;
      return `${prefix}-${String(sequence).padStart(4, '0')}`;
    }

    return `${prefix}-0001`;
  }
}

export default new GoodsReceiptService();
