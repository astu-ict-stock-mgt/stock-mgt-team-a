import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../../../utils/errors.js';

const prisma = new PrismaClient();

class CategoryService {
  async create(categoryData) {
    const existingCategory = await prisma.category.findUnique({
      where: { code: categoryData.code },
    });

    if (existingCategory) {
      throw new ConflictError(`Category with code ${categoryData.code} already exists`);
    }

    if (categoryData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryData.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundError('Parent category not found');
      }
    }

    return prisma.category.create({
      data: categoryData,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async findAll(filters = {}) {
    const { status, parentId, search } = filters;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.category.findMany({
      where,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { children: true, items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          select: { id: true, code: true, name: true },
        },
        items: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async update(id, updateData) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (updateData.code && updateData.code !== category.code) {
      const existingCategory = await prisma.category.findUnique({
        where: { code: updateData.code },
      });

      if (existingCategory) {
        throw new ConflictError(`Category with code ${updateData.code} already exists`);
      }
    }

    if (updateData.parentId) {
      if (updateData.parentId === id) {
        throw new ValidationError('Category cannot be its own parent');
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: updateData.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundError('Parent category not found');
      }
    }

    return prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async updateStatus(id, status) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return prisma.category.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        items: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category.children.length > 0) {
      throw new ValidationError('Cannot delete category with child categories');
    }

    if (category.items.length > 0) {
      throw new ValidationError('Cannot delete category with associated items');
    }

    return prisma.category.delete({ where: { id } });
  }

  async getHierarchy() {
    const categories = await prisma.category.findMany({
      where: { parentId: null, status: 'ACTIVE' },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }
}

export default new CategoryService();
