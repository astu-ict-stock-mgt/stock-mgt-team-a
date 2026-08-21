import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MasterDataService {
  async search(query, filters = {}) {
    const { type, status, limit = 50 } = filters;

    const results = {};

    if (!type || type === 'stores') {
      results.stores = await prisma.store.findMany({
        where: {
          ...(status && { status }),
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    }

    if (!type || type === 'departments') {
      results.departments = await prisma.department.findMany({
        where: {
          ...(status && { status }),
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    }

    if (!type || type === 'categories') {
      results.categories = await prisma.category.findMany({
        where: {
          ...(status && { status }),
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    }

    if (!type || type === 'units') {
      results.units = await prisma.unit.findMany({
        where: {
          ...(status && { status }),
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
              { symbol: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    }

    if (!type || type === 'items') {
      results.items = await prisma.item.findMany({
        where: {
          ...(status && { status }),
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
              { barcode: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          category: { select: { id: true, code: true, name: true } },
          unit: { select: { id: true, code: true, name: true, symbol: true } },
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    }

    if (!type || type === 'suppliers') {
      results.suppliers = await prisma.supplier.findMany({
        where: {
          ...(status && { status }),
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
              { contactPerson: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    }

    if (!type || type === 'locations') {
      results.locations = await prisma.location.findMany({
        where: {
          ...(status && { status }),
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          store: { select: { id: true, code: true, name: true } },
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    }

    return results;
  }

  async getStats() {
    const [stores, departments, categories, units, items, suppliers, locations] = await Promise.all([
      prisma.store.count({ where: { status: 'ACTIVE' } }),
      prisma.department.count({ where: { status: 'ACTIVE' } }),
      prisma.category.count({ where: { status: 'ACTIVE' } }),
      prisma.unit.count({ where: { status: 'ACTIVE' } }),
      prisma.item.count({ where: { status: 'ACTIVE' } }),
      prisma.supplier.count({ where: { status: 'ACTIVE' } }),
      prisma.location.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      stores,
      departments,
      categories,
      units,
      items,
      suppliers,
      locations,
      total: stores + departments + categories + units + items + suppliers + locations,
    };
  }
}

export default new MasterDataService();
