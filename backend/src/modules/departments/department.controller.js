import departmentService from './department.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class DepartmentController {
  async create(req, res, next) {
    try {
      const department = await departmentService.create(req.body);
      return sendSuccess(res, department, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findAll(req, res, next) {
    try {
      const departments = await departmentService.findAll(req.query);
      return sendSuccess(res, departments);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async findById(req, res, next) {
    try {
      const department = await departmentService.findById(req.params.id);
      return sendSuccess(res, department);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req, res, next) {
    try {
      const department = await departmentService.update(req.params.id, req.body);
      return sendSuccess(res, department);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const department = await departmentService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, department);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async delete(req, res, next) {
    try {
      await departmentService.delete(req.params.id);
      return sendSuccess(res, { message: 'Department deleted successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async addStore(req, res, next) {
    try {
      const { storeId, isPrimary } = req.body;
      const assignment = await departmentService.addStore(req.params.id, storeId, isPrimary);
      return sendSuccess(res, assignment, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async removeStore(req, res, next) {
    try {
      await departmentService.removeStore(req.params.id, req.params.storeId);
      return sendSuccess(res, { message: 'Store removed from department successfully' });
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new DepartmentController();
