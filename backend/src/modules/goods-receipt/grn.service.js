/**
 * Goods Receiving Note (GRN) Service
 * BE-150: Notification events integrated — all calls are fire-and-forget.
 */
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import {
  notifyGRNCreated,
  notifyGoodsReceiptEvaluationRequired,
} from '../notifications/notification-events.service.js';

const prisma = new PrismaClient();

class GRNService {
  async create(grnData, userId) {
    const receipt = await prisma.goodsReceipt.findUnique({
      where: { id: grnData.goodsReceiptId },
    });

    if (!receipt) {
      throw new NotFoundError('Goods receipt not found');
    }

    if (receipt.status !== 'APPROVED') {
      throw new ValidationError('Goods receipt must be APPROVED to create GRN');
    }

    const existingGRN = await prisma.gRN.findUnique({
      where: { goodsReceiptId: grnData.goodsReceiptId },
    });

    if (existingGRN) {
      throw new ValidationError('GRN already exists for this goods receipt');
    }

    const grnNumber = await this.generateGRNNumber();

    const grn = await prisma.gRN.create({
      data: {
        grnNumber,
        goodsReceiptId: grnData.goodsReceiptId,
        notes: grnData.notes,
      },
      include: {
        goodsReceipt: {
          include: {
            supplier: { select: { id: true, code: true, name: true } },
            store: { select: { id: true, code: true, name: true } },
            lines: {
              include: {
                item: { select: { id: true, code: true, name: true } },
                unit: { select: { id: true, code: true, symbol: true } },
              },
            },
          },
        },
      },
    });

    // BE-150: Notify STOREKEEPER + ACCOUNTANT of new GRN — fire-and-forget
    notifyGRNCreated({
      grnId: grn.id,
      grnNumber: grn.grnNumber,
      creatorId: userId,
    }).catch(() => {});

    // BE-150: If goods receipt requires evaluation, notify TEC — fire-and-forget
    if (receipt.status === 'PENDING_EVALUATION' || receipt.requiresEvaluation) {
      notifyGoodsReceiptEvaluationRequired({
        goodsReceiptId: grnData.goodsReceiptId,
        receiptNumber: receipt.receiptNumber || grnData.goodsReceiptId,
        submitterId: userId,
      }).catch(() => {});
    }

    return grn;
  }

  async findAll(filters = {}) {
    const { status, search } = filters;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { grnNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.gRN.findMany({
      where,
      include: {
        goodsReceipt: {
          include: {
            supplier: { select: { id: true, code: true, name: true } },
            store: { select: { id: true, code: true, name: true } },
          },
        },
        finalizedByUser: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const grn = await prisma.gRN.findUnique({
      where: { id },
      include: {
        goodsReceipt: {
          include: {
            supplier: { select: { id: true, code: true, name: true, contactPerson: true, phone: true } },
            store: { select: { id: true, code: true, name: true } },
            department: { select: { id: true, code: true, name: true } },
            lines: {
              include: {
                item: { select: { id: true, code: true, name: true } },
                unit: { select: { id: true, code: true, symbol: true } },
                location: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
        finalizedByUser: { select: { id: true, fullName: true } },
      },
    });

    if (!grn) {
      throw new NotFoundError('GRN not found');
    }

    return grn;
  }

  async finalize(id, userId) {
    const grn = await prisma.gRN.findUnique({
      where: { id },
    });

    if (!grn) {
      throw new NotFoundError('GRN not found');
    }

    if (grn.status !== 'DRAFT') {
      throw new ValidationError('GRN must be in DRAFT status to finalize');
    }

    const updated = await prisma.gRN.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        finalizedDate: new Date(),
        finalizedBy: userId,
      },
    });

    // BE-150: Notify STOREKEEPER + ACCOUNTANT on finalization — fire-and-forget
    notifyGRNCreated({
      grnId: updated.id,
      grnNumber: updated.grnNumber,
      creatorId: userId,
    }).catch(() => {});

    return updated;
  }

  async cancel(id) {
    const grn = await prisma.gRN.findUnique({
      where: { id },
    });

    if (!grn) {
      throw new NotFoundError('GRN not found');
    }

    if (grn.status === 'FINALIZED') {
      throw new ValidationError('Cannot cancel finalized GRN');
    }

    return prisma.gRN.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async generateGRNNumber() {
    const today = new Date();
    const prefix = `GRN-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const lastGRN = await prisma.gRN.findFirst({
      where: {
        grnNumber: { startsWith: prefix },
      },
      orderBy: { grnNumber: 'desc' },
    });

    if (lastGRN) {
      const sequence = parseInt(lastGRN.grnNumber.split('-')[2]) + 1;
      return `${prefix}-${String(sequence).padStart(4, '0')}`;
    }

    return `${prefix}-0001`;
  }
}

export default new GRNService();
