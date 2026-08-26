import evaluationService from './evaluation.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class EvaluationController {
  async create(req, res, next) {
    try {
      const evaluation = await evaluationService.create(req.body, req.user.userId);
      return sendSuccess(res, evaluation, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const evaluations = await evaluationService.findAll(req.query);
      return sendSuccess(res, evaluations);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const evaluation = await evaluationService.findById(req.params.id);
      return sendSuccess(res, evaluation);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async startEvaluation(req, res, next) {
    try {
      const evaluation = await evaluationService.startEvaluation(req.params.id, req.user.userId);
      return sendSuccess(res, evaluation);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateDecision(req, res, next) {
    try {
      const evaluation = await evaluationService.updateDecision(
        req.params.id,
        req.body.decision,
        req.user.userId
      );
      return sendSuccess(res, evaluation);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new EvaluationController();
