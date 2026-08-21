import validationService from './validation.service.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

class ValidationController {
  async validateCode(req, res, next) {
    try {
      const { type, code, excludeId } = req.body;

      switch (type) {
        case 'store':
          await validationService.validateStoreCode(code, excludeId);
          break;
        case 'department':
          await validationService.validateDepartmentCode(code, excludeId);
          break;
        case 'category':
          await validationService.validateCategoryCode(code, excludeId);
          break;
        case 'unit':
          await validationService.validateUnitCode(code, excludeId);
          break;
        case 'item':
          await validationService.validateItemCode(code, excludeId);
          break;
        case 'supplier':
          await validationService.validateSupplierCode(code, excludeId);
          break;
        case 'location':
          await validationService.validateLocationCode(code, excludeId);
          break;
        default:
          return sendError(res, new Error('Invalid validation type'));
      }

      return sendSuccess(res, { valid: true });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async validateStockLevels(req, res, next) {
    try {
      const { itemId, quantity } = req.body;
      await validationService.validateStockLevels(itemId, quantity);
      return sendSuccess(res, { valid: true });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async validateHierarchy(req, res, next) {
    try {
      const { type, id, parentId } = req.body;

      if (type === 'category') {
        await validationService.validateCategoryHierarchy(id, parentId);
      } else if (type === 'location') {
        await validationService.validateLocationHierarchy(id, parentId);
      } else {
        return sendError(res, new Error('Invalid hierarchy type'));
      }

      return sendSuccess(res, { valid: true });
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new ValidationController();
