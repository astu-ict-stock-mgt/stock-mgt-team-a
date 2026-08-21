import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../../utils/errors.js';

const prisma = new PrismaClient();

class SupplierService {
  async create(supplierData) {
    const existingSupplier = await prisma.supplier.findUnique({
      where: { code: supplierData.code },
    });

    if (existingSupplier) {
      throw new ConflictError(`Supplier with code ${supplierData.code} already exists`);
    }

    return prisma.supplier.create({
      data: supplierData,
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
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.supplier.findMany({
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
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        items: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplier;
  }

  async update(id, updateData) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    if (updateData.code && updateData.code !== supplier.code) {
      const existingSupplier = await prisma.supplier.findUnique({
        where: { code: updateData.code },
      });

      if (existingSupplier) {
        throw new ConflictError(`Supplier with code ${updateData.code} already exists`);
      }
    }

    return prisma.supplier.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStatus(id, status) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return prisma.supplier.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    if (supplier.items.length > 0) {
      throw new ConflictError('Cannot delete supplier with associated items');
    }

    return prisma.supplier.delete({ where: { id } });
  }
}

export default new SupplierService();
