import { PrismaClient } from '@prisma/client';
import { ValidationError } from '../../../utils/errors.js';

const prisma = new PrismaClient();

class ValidationService {
  async validateStoreCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.store.findFirst({ where });
    if (existing) {
      throw new ValidationError(`Store code ${code} already exists`);
    }
    return true;
  }

  async validateDepartmentCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.department.findFirst({ where });
    if (existing) {
      throw new ValidationError(`Department code ${code} already exists`);
    }
    return true;
  }

  async validateCategoryCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.category.findFirst({ where });
    if (existing) {
      throw new ValidationError(`Category code ${code} already exists`);
    }
    return true;
  }

  async validateUnitCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.unit.findFirst({ where });
    if (existing) {
      throw new ValidationError(`Unit code ${code} already exists`);
    }
    return true;
  }

  async validateItemCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.item.findFirst({ where });
    if (existing) {
      throw new ValidationError(`Item code ${code} already exists`);
    }
    return true;
  }

  async validateSupplierCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.supplier.findFirst({ where });
    if (existing) {
      throw new ValidationError(`Supplier code ${code} already exists`);
    }
    return true;
  }

  async validateLocationCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.location.findFirst({ where });
    if (existing) {
      throw new ValidationError(`Location code ${code} already exists`);
    }
    return true;
  }

  async validateStockLevels(itemId, requestedQuantity) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new ValidationError('Item not found');
    }

    if (item.maximumStock && requestedQuantity > item.maximumStock) {
      throw new ValidationError(`Requested quantity exceeds maximum stock of ${item.maximumStock}`);
    }

    return true;
  }

  async validateCategoryHierarchy(categoryId, parentId) {
    if (categoryId === parentId) {
      throw new ValidationError('Category cannot be its own parent');
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new ValidationError('Parent category not found');
      }
    }

    return true;
  }

  async validateLocationHierarchy(locationId, parentId) {
    if (locationId === parentId) {
      throw new ValidationError('Location cannot be its own parent');
    }

    if (parentId) {
      const parent = await prisma.location.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new ValidationError('Parent location not found');
      }
    }

    return true;
  }
}

export default new ValidationService();
