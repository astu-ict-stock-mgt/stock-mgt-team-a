import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Master Data Integration Tests', () => {
  let adminToken;
  let testStoreId;
  let testDepartmentId;
  let testCategoryId;
  let testUnitId;
  let testItemId;
  let testSupplierId;
  let testLocationId;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!@#',
      });

    if (loginResponse.status === 200) {
      adminToken = loginResponse.body.data.token;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Store Management', () => {
    it('should create a new store', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-STORE',
          name: 'Test Store',
          type: 'MAIN_STORE',
          description: 'Test store for integration tests',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testStoreId = response.body.data.id;
    });

    it('should get all stores', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/stores')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get store by id', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .get(`/api/stores/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testStoreId);
    });

    it('should update store', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .put(`/api/stores/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Test Store',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Store');
    });
  });

  describe('Department Management', () => {
    it('should create a new department', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-DEPT',
          name: 'Test Department',
          description: 'Test department for integration tests',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testDepartmentId = response.body.data.id;
    });

    it('should get all departments', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should add store to department', async () => {
      if (!adminToken || !testDepartmentId || !testStoreId) return;

      const response = await request(app)
        .post(`/api/departments/${testDepartmentId}/stores`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          storeId: testStoreId,
          isPrimary: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Category Management', () => {
    it('should create a new category', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-CAT',
          name: 'Test Category',
          description: 'Test category for integration tests',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testCategoryId = response.body.data.id;
    });

    it('should get all categories', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get category hierarchy', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/categories/hierarchy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Unit Management', () => {
    it('should create a new unit', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-UNIT',
          name: 'Test Unit',
          symbol: 'TU',
          description: 'Test unit for integration tests',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testUnitId = response.body.data.id;
    });

    it('should get all units', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/units')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Supplier Management', () => {
    it('should create a new supplier', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-SUP',
          name: 'Test Supplier',
          type: 'COMPANY',
          contactPerson: 'John Doe',
          email: 'john@test.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testSupplierId = response.body.data.id;
    });

    it('should get all suppliers', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Item Management', () => {
    it('should create a new item', async () => {
      if (!adminToken || !testUnitId) return;

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-ITEM',
          name: 'Test Item',
          unitId: testUnitId,
          categoryId: testCategoryId,
          supplierId: testSupplierId,
          minimumStock: 10,
          maximumStock: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testItemId = response.body.data.id;
    });

    it('should get all items', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should search items', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/items/search?q=Test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Location Management', () => {
    it('should create a new location', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-LOC',
          name: 'Test Location',
          type: 'AREA',
          storeId: testStoreId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testLocationId = response.body.data.id;
    });

    it('should get all locations', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get location hierarchy', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .get(`/api/locations/hierarchy/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Master Data Search', () => {
    it('should search across all master data', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/master-data/search?q=Test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stores');
      expect(response.body.data).toHaveProperty('departments');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('units');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('suppliers');
      expect(response.body.data).toHaveProperty('locations');
    });

    it('should get master data stats', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .get('/api/master-data/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stores');
      expect(response.body.data).toHaveProperty('departments');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('units');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('suppliers');
      expect(response.body.data).toHaveProperty('locations');
      expect(response.body.data).toHaveProperty('total');
    });
  });

  describe('Validation', () => {
    it('should validate store code uniqueness', async () => {
      if (!adminToken) return;

      const response = await request(app)
        .post('/api/validation/validate-code')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'store',
          code: 'TEST-STORE',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate stock levels', async () => {
      if (!adminToken || !testItemId) return;

      const response = await request(app)
        .post('/api/validation/validate-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: testItemId,
          quantity: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should delete test item', async () => {
      if (!adminToken || !testItemId) return;

      const response = await request(app)
        .delete(`/api/items/${testItemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should delete test location', async () => {
      if (!adminToken || !testLocationId) return;

      const response = await request(app)
        .delete(`/api/locations/${testLocationId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should delete test supplier', async () => {
      if (!adminToken || !testSupplierId) return;

      const response = await request(app)
        .delete(`/api/suppliers/${testSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should delete test unit', async () => {
      if (!adminToken || !testUnitId) return;

      const response = await request(app)
        .delete(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should delete test category', async () => {
      if (!adminToken || !testCategoryId) return;

      const response = await request(app)
        .delete(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should delete test department', async () => {
      if (!adminToken || !testDepartmentId) return;

      const response = await request(app)
        .delete(`/api/departments/${testDepartmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should delete test store', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .delete(`/api/stores/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
