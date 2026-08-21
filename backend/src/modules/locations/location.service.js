import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../../../utils/errors.js';

const prisma = new PrismaClient();

class LocationService {
  async create(locationData) {
    const existingLocation = await prisma.location.findUnique({
      where: { code: locationData.code },
    });

    if (existingLocation) {
      throw new ConflictError(`Location with code ${locationData.code} already exists`);
    }

    if (locationData.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: locationData.storeId },
      });
      if (!store) {
        throw new NotFoundError('Store not found');
      }
    }

    if (locationData.parentId) {
      const parentLocation = await prisma.location.findUnique({
        where: { id: locationData.parentId },
      });
      if (!parentLocation) {
        throw new NotFoundError('Parent location not found');
      }
    }

    return prisma.location.create({
      data: locationData,
      include: {
        store: {
          select: { id: true, code: true, name: true },
        },
        parent: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async findAll(filters = {}) {
    const { status, storeId, type, search } = filters;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (storeId) {
      where.storeId = storeId;
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

    return prisma.location.findMany({
      where,
      include: {
        store: {
          select: { id: true, code: true, name: true },
        },
        parent: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { children: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        store: {
          select: { id: true, code: true, name: true },
        },
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          select: { id: true, code: true, name: true, type: true },
        },
      },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    return location;
  }

  async update(id, updateData) {
    const location = await prisma.location.findUnique({ where: { id } });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    if (updateData.code && updateData.code !== location.code) {
      const existingLocation = await prisma.location.findUnique({
        where: { code: updateData.code },
      });

      if (existingLocation) {
        throw new ConflictError(`Location with code ${updateData.code} already exists`);
      }
    }

    if (updateData.parentId) {
      if (updateData.parentId === id) {
        throw new ValidationError('Location cannot be its own parent');
      }

      const parentLocation = await prisma.location.findUnique({
        where: { id: updateData.parentId },
      });

      if (!parentLocation) {
        throw new NotFoundError('Parent location not found');
      }
    }

    return prisma.location.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: { id: true, code: true, name: true },
        },
        parent: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async updateStatus(id, status) {
    const location = await prisma.location.findUnique({ where: { id } });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    return prisma.location.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    if (location.children.length > 0) {
      throw new ValidationError('Cannot delete location with child locations');
    }

    return prisma.location.delete({ where: { id } });
  }

  async getHierarchy(storeId) {
    const locations = await prisma.location.findMany({
      where: {
        storeId,
        parentId: null,
        status: 'ACTIVE',
      },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return locations;
  }
}

export default new LocationService();
