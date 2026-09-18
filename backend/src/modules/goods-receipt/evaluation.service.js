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

    const completedEval = await prisma.technicalEvaluation.findFirst({
      where: {
        goodsReceiptId: evaluationData.goodsReceiptId,
        status: 'COMPLETED',
      },
    });
    if (completedEval) {
      throw new ValidationError('An evaluation has already been completed for this goods receipt');
    }

    const evaluatorIds = Array.isArray(evaluationData.evaluatorIds) && evaluationData.evaluatorIds.length > 0
      ? Array.from(new Set(evaluationData.evaluatorIds))
      : [evaluationData.evaluatorId || userId];

    // Remove existing pending / in_progress evaluations to reassign fresh committee
    await prisma.technicalEvaluation.deleteMany({
      where: {
        goodsReceiptId: evaluationData.goodsReceiptId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    // Create technical evaluation record for each assigned committee member
    const evaluations = await Promise.all(
      evaluatorIds.map(evalId =>
        prisma.technicalEvaluation.create({
          data: {
            goodsReceiptId: evaluationData.goodsReceiptId,
            evaluatorId: evalId,
            notes: evaluationData.notes || null,
            status: 'PENDING',
          },
          include: {
            goodsReceipt: { select: { id: true, receiptNumber: true } },
            evaluator: { select: { id: true, fullName: true, email: true } },
          },
        })
      )
    );

    return evaluations.length === 1 ? evaluations[0] : evaluations;
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

  async updateDecision(id, decision, userId, notes) {
    const evaluation = await prisma.technicalEvaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundError('Technical evaluation not found');
    }

    if (evaluation.status !== 'IN_PROGRESS') {
      throw new ValidationError('Evaluation must be in IN_PROGRESS status');
    }

    // Complete only the evaluating member's technical evaluation record
    const updated = await prisma.technicalEvaluation.update({
      where: { id },
      data: {
        decision,
        decisionDate: new Date(),
        status: 'COMPLETED',
        notes: notes !== undefined ? notes : evaluation.notes,
      },
      include: {
        goodsReceipt: { select: { id: true, receiptNumber: true } },
        evaluator: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Check status of all committee members assigned to this goods receipt
    const allCommitteeEvals = await prisma.technicalEvaluation.findMany({
      where: { goodsReceiptId: evaluation.goodsReceiptId },
      include: { evaluator: { select: { id: true, fullName: true } } },
    });

    const pendingMembers = allCommitteeEvals.filter(e => e.status !== 'COMPLETED');
    const allCompleted = pendingMembers.length === 0;

    // Only update GoodsReceipt status to EVALUATED / REJECTED when ALL assigned committee members have submitted
    if (allCompleted) {
      const anyRejected = allCommitteeEvals.some(e => e.decision === 'REJECTED');
      const finalDecision = anyRejected ? 'REJECTED' : 'APPROVED';
      const newStatus = finalDecision === 'APPROVED' ? 'EVALUATED' : 'REJECTED';

      const goodsReceipt = await prisma.goodsReceipt.update({
        where: { id: evaluation.goodsReceiptId },
        data: { status: newStatus },
        select: { id: true, receiptNumber: true },
      });

      // BE-150: Notify STOREKEEPER and PAO of finalized committee evaluation decision
      notifyMaterialDecision({
        entityType: 'GOODS_RECEIPT',
        decision: finalDecision,
        entityId: goodsReceipt.id,
        entityNumber: goodsReceipt.receiptNumber,
        deciderId: userId,
      }).catch(() => {});
    }

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

    // Mark all committee evaluations for this receipt as IN_PROGRESS
    await prisma.technicalEvaluation.updateMany({
      where: { goodsReceiptId: evaluation.goodsReceiptId, status: 'PENDING' },
      data: { status: 'IN_PROGRESS' },
    });

    return prisma.technicalEvaluation.findUnique({
      where: { id },
    });
  }
}

export default new EvaluationService();
