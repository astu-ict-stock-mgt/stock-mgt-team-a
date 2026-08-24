import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js';

const prisma = new PrismaClient();

class StoreService {
  async create(storeData) {
    const existingStore = await prisma.store.findUnique({
      where: { code: storeData.code },
    });

    if (existingStore) {
      throw new ConflictError(`Store with code ${storeData.code} already exists`);
    }

    return prisma.store.create({
      data: storeData,
      include: {
        responsibleOfficer: {
          select: { id: true, fullName: true, email: true },
        },
        departments: {
          include: {
            department: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });
  }

  async findAll(filters = {}) {
    const { status, type, search } = filters;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.store.findMany({
      where,
      include: {
        responsibleOfficer: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { departments: true, locations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        responsibleOfficer: {
          select: { id: true, fullName: true, email: true },
        },
        departments: {
          include: {
            department: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        locations: {
          select: { id: true, code: true, name: true, type: true },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return store;
  }

  async update(id, updateData) {
    const store = await prisma.store.findUnique({ where: { id } });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    if (updateData.code && updateData.code !== store.code) {
      const existingStore = await prisma.store.findUnique({
        where: { code: updateData.code },
      });

      if (existingStore) {
        throw new ConflictError(`Store with code ${updateData.code} already exists`);
      }
    }

    return prisma.store.update({
      where: { id },
      data: updateData,
      include: {
        responsibleOfficer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async updateStatus(id, status) {
    const store = await prisma.store.findUnique({ where: { id } });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return prisma.store.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        departments: true,
        locations: true,
      },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    if (store.departments.length > 0 || store.locations.length > 0) {
      throw new ValidationError('Cannot delete store with associated departments or locations');
    }

    return prisma.store.delete({ where: { id } });
  }
}

export default new StoreService();
