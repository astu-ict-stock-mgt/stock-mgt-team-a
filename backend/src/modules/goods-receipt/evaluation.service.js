import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { notifyMaterialDecision } from '../notifications/notification-events.service.js';

const prisma = new PrismaClient();

class EvaluationService {
  async create(evaluationData, userId) {
    const receipt = await prisma.goodsReceipt.findUnique({
      where: { id: evaluationData.goodsReceiptId },
    });

    if (!receipt) {
      throw new NotFoundError('Goods receipt not found');
    }

    if (receipt.status !== 'PENDING_EVALUATION') {
      throw new ValidationError('Goods receipt must be in PENDING_EVALUATION status');
    }

    return prisma.technicalEvaluation.create({
      data: {
        goodsReceiptId: evaluationData.goodsReceiptId,
        evaluatorId: userId,
        notes: evaluationData.notes,
      },
      include: {
        goodsReceipt: { select: { id: true, receiptNumber: true } },
        evaluator: { select: { id: true, fullName: true } },
      },
    });
  }

  async findAll(filters = {}) {
    const { status, evaluatorId, goodsReceiptId } = filters;

    const where = {};
    if (status) where.status = status;
    if (evaluatorId) where.evaluatorId = evaluatorId;
    if (goodsReceiptId) where.goodsReceiptId = goodsReceiptId;

    return prisma.technicalEvaluation.findMany({
      where,
      include: {
        goodsReceipt: { select: { id: true, receiptNumber: true } },
        evaluator: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const evaluation = await prisma.technicalEvaluation.findUnique({
      where: { id },
      include: {
        goodsReceipt: {
          include: {
            supplier: { select: { id: true, code: true, name: true } },
            store: { select: { id: true, code: true, name: true } },
            lines: {
              include: {
                item: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
        evaluator: { select: { id: true, fullName: true } },
      },
    });

    if (!evaluation) {
      throw new NotFoundError('Technical evaluation not found');
    }

    return evaluation;
  }

  async updateDecision(id, decision, userId) {
    const evaluation = await prisma.technicalEvaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundError('Technical evaluation not found');
    }

    if (evaluation.status !== 'IN_PROGRESS') {
      throw new ValidationError('Evaluation must be in IN_PROGRESS status');
    }

    const updated = await prisma.technicalEvaluation.update({
      where: { id },
      data: {
        decision,
        decisionDate: new Date(),
        status: 'COMPLETED',
      },
    });

    // Update goods receipt status based on decision
    const newStatus = decision === 'APPROVED' ? 'EVALUATED' : 'REJECTED';
    const goodsReceipt = await prisma.goodsReceipt.update({
      where: { id: evaluation.goodsReceiptId },
      data: { status: newStatus },
      select: { id: true, receiptNumber: true },
    });

    // BE-150: Notify STOREKEEPER and PAO of evaluation decision — fire-and-forget
    notifyMaterialDecision({
      entityType: 'GOODS_RECEIPT',
      decision,
      entityId: goodsReceipt.id,
      entityNumber: goodsReceipt.receiptNumber,
      deciderId: userId,
    }).catch(() => {});

    return updated;
  }

  async startEvaluation(id, userId) {
    const evaluation = await prisma.technicalEvaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundError('Technical evaluation not found');
    }

    if (evaluation.status !== 'PENDING') {
      throw new ValidationError('Evaluation must be in PENDING status');
    }

    return prisma.technicalEvaluation.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }
}

export default new EvaluationService();
