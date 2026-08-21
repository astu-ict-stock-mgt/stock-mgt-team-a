import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../../../utils/errors.js';

const prisma = new PrismaClient();

class DepartmentService {
  async create(departmentData) {
    const existingDepartment = await prisma.department.findUnique({
      where: { code: departmentData.code },
    });

    if (existingDepartment) {
      throw new ConflictError(`Department with code ${departmentData.code} already exists`);
    }

    return prisma.department.create({
      data: departmentData,
      include: {
        headUser: {
          select: { id: true, fullName: true, email: true },
        },
        stores: {
          include: {
            store: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });
  }

  async findAll(filters = {}) {
    const { status, search } = filters;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.department.findMany({
      where,
      include: {
        headUser: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { stores: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        headUser: {
          select: { id: true, fullName: true, email: true },
        },
        stores: {
          include: {
            store: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return department;
  }

  async update(id, updateData) {
    const department = await prisma.department.findUnique({ where: { id } });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    if (updateData.code && updateData.code !== department.code) {
      const existingDepartment = await prisma.department.findUnique({
        where: { code: updateData.code },
      });

      if (existingDepartment) {
        throw new ConflictError(`Department with code ${updateData.code} already exists`);
      }
    }

    return prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        headUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async updateStatus(id, status) {
    const department = await prisma.department.findUnique({ where: { id } });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return prisma.department.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        stores: true,
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    if (department.stores.length > 0) {
      throw new ValidationError('Cannot delete department with associated stores');
    }

    return prisma.department.delete({ where: { id } });
  }

  async addStore(departmentId, storeId, isPrimary = false) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    const existingAssignment = await prisma.storeDepartment.findUnique({
      where: {
        storeId_departmentId: { storeId, departmentId },
      },
    });

    if (existingAssignment) {
      throw new ConflictError('Department is already assigned to this store');
    }

    return prisma.storeDepartment.create({
      data: {
        storeId,
        departmentId,
        isPrimary,
      },
    });
  }

  async removeStore(departmentId, storeId) {
    const assignment = await prisma.storeDepartment.findUnique({
      where: {
        storeId_departmentId: { storeId, departmentId },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Store assignment not found');
    }

    return prisma.storeDepartment.delete({
      where: {
        storeId_departmentId: { storeId, departmentId },
      },
    });
  }
}

export default new DepartmentService();
