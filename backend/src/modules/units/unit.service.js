import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../../../utils/errors.js';

const prisma = new PrismaClient();

class UnitService {
  async create(unitData) {
    const existingUnit = await prisma.unit.findUnique({
      where: { code: unitData.code },
    });

    if (existingUnit) {
      throw new ConflictError(`Unit with code ${unitData.code} already exists`);
    }

    return prisma.unit.create({
      data: unitData,
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
        { symbol: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.unit.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        items: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    return unit;
  }

  async update(id, updateData) {
    const unit = await prisma.unit.findUnique({ where: { id } });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    if (updateData.code && updateData.code !== unit.code) {
      const existingUnit = await prisma.unit.findUnique({
        where: { code: updateData.code },
      });

      if (existingUnit) {
        throw new ConflictError(`Unit with code ${updateData.code} already exists`);
      }
    }

    return prisma.unit.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStatus(id, status) {
    const unit = await prisma.unit.findUnique({ where: { id } });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    return prisma.unit.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    if (unit.items.length > 0) {
      throw new ValidationError('Cannot delete unit with associated items');
    }

    return prisma.unit.delete({ where: { id } });
  }
}

export default new UnitService();
