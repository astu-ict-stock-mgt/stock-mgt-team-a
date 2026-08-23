import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js';

const prisma = new PrismaClient();

class ItemService {
  async create(itemData) {
    const existingItem = await prisma.item.findUnique({
      where: { code: itemData.code },
    });

    if (existingItem) {
      throw new ConflictError(`Item with code ${itemData.code} already exists`);
    }

    if (itemData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: itemData.categoryId },
      });
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    if (itemData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: itemData.unitId },
      });
      if (!unit) {
        throw new NotFoundError('Unit not found');
      }
    }

    if (itemData.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: itemData.supplierId },
      });
      if (!supplier) {
        throw new NotFoundError('Supplier not found');
      }
    }

    return prisma.item.create({
      data: itemData,
      include: {
        category: {
          select: { id: true, code: true, name: true },
        },
        unit: {
          select: { id: true, code: true, name: true, symbol: true },
        },
        supplier: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async findAll(filters = {}) {
    const { status, categoryId, unitId, supplierId, search } = filters;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.item.findMany({
      where,
      include: {
        category: {
          select: { id: true, code: true, name: true },
        },
        unit: {
          select: { id: true, code: true, name: true, symbol: true },
        },
        supplier: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, code: true, name: true },
        },
        unit: {
          select: { id: true, code: true, name: true, symbol: true },
        },
        supplier: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    return item;
  }

  async update(id, updateData) {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    if (updateData.code && updateData.code !== item.code) {
      const existingItem = await prisma.item.findUnique({
        where: { code: updateData.code },
      });

      if (existingItem) {
        throw new ConflictError(`Item with code ${updateData.code} already exists`);
      }
    }

    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    if (updateData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: updateData.unitId },
      });
      if (!unit) {
        throw new NotFoundError('Unit not found');
      }
    }

    if (updateData.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: updateData.supplierId },
      });
      if (!supplier) {
        throw new NotFoundError('Supplier not found');
      }
    }

    return prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, code: true, name: true },
        },
        unit: {
          select: { id: true, code: true, name: true, symbol: true },
        },
        supplier: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async updateStatus(id, status) {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    return prisma.item.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id) {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    return prisma.item.delete({ where: { id } });
  }

  async search(query) {
    const items = await prisma.item.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: {
          select: { id: true, code: true, name: true },
        },
        unit: {
          select: { id: true, code: true, name: true, symbol: true },
        },
      },
      take: 50,
    });

    return items;
  }
}

export default new ItemService();
