import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GRN/Inventory Transaction Tests', () => {
  let adminToken;
  let testItemId;
  let testUnitId;
  let testStoreId;
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

    // Create test data
    if (adminToken) {
      // Create unit
      const unitResponse = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-UOM-INV',
          name: 'Test Unit for Inventory',
          symbol: 'TUI',
        });
      if (unitResponse.status === 201) {
        testUnitId = unitResponse.body.data.id;
      }

      // Create store
      const storeResponse = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-STORE-INV',
          name: 'Test Store for Inventory',
          type: 'MAIN_STORE',
        });
      if (storeResponse.status === 201) {
        testStoreId = storeResponse.body.data.id;
      }

      // Create item
      if (testUnitId) {
        const itemResponse = await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            code: 'TEST-ITEM-INV',
            name: 'Test Item for Inventory',
            unitId: testUnitId,
          });
        if (itemResponse.status === 201) {
          testItemId = itemResponse.body.data.id;
        }
      }

      // Create location
      if (testStoreId) {
        const locationResponse = await request(app)
          .post('/api/locations')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            code: 'TEST-LOC-INV',
            name: 'Test Location for Inventory',
            type: 'BIN',
            storeId: testStoreId,
          });
        if (locationResponse.status === 201) {
          testLocationId = locationResponse.body.data.id;
        }
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testLocationId) await prisma.location.delete({ where: { id: testLocationId } }).catch(() => {});
    if (testItemId) await prisma.item.delete({ where: { id: testItemId } }).catch(() => {});
    if (testUnitId) await prisma.unit.delete({ where: { id: testUnitId } }).catch(() => {});
    if (testStoreId) await prisma.store.delete({ where: { id: testStoreId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Transaction Posting', () => {
    it('should post a receipt transaction', async () => {
      if (!adminToken || !testItemId || !testStoreId) return;

      const response = await request(app)
        .post('/api/inventory/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: testItemId,
          storeId: testStoreId,
          transactionType: 'RECEIPT',
          quantity: 100,
          referenceType: 'GOODS_RECEIPT',
          referenceId: 'test-receipt-id',
          referenceNumber: 'GR-202608-0001',
          notes: 'Test receipt',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBe(100);
    });

    it('should get stock balance', async () => {
      if (!adminToken || !testItemId || !testStoreId) return;

      const response = await request(app)
        .get(`/api/inventory/stock/${testItemId}/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(100);
    });

    it('should post an issue transaction', async () => {
      if (!adminToken || !testItemId || !testStoreId) return;

      const response = await request(app)
        .post('/api/inventory/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: testItemId,
          storeId: testStoreId,
          transactionType: 'ISSUE',
          quantity: 25,
          referenceType: 'SIV',
          referenceId: 'test-siv-id',
          referenceNumber: 'SIV-202608-0001',
          notes: 'Test issue',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBe(75);
    });

    it('should reject issue when insufficient stock', async () => {
      if (!adminToken || !testItemId || !testStoreId) return;

      const response = await request(app)
        .post('/api/inventory/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: testItemId,
          storeId: testStoreId,
          transactionType: 'ISSUE',
          quantity: 200,
          referenceType: 'SIV',
          referenceId: 'test-siv-id-2',
          referenceNumber: 'SIV-202608-0002',
          notes: 'Test issue with insufficient stock',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should get transaction history', async () => {
      if (!adminToken || !testItemId || !testStoreId) return;

      const response = await request(app)
        .get('/api/inventory/transactions/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ itemId: testItemId, storeId: testStoreId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Stock Reports', () => {
    it('should get stock by store', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .get(`/api/inventory/stock/store/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get stock value', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .get(`/api/inventory/stock/value/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalValue');
    });

    it('should get low stock items', async () => {
      if (!adminToken || !testStoreId) return;

      const response = await request(app)
        .get(`/api/inventory/stock/low/${testStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Bin Card', () => {
    it('should post transaction with location', async () => {
      if (!adminToken || !testItemId || !testStoreId || !testLocationId) return;

      const response = await request(app)
        .post('/api/inventory/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: testItemId,
          storeId: testStoreId,
          locationId: testLocationId,
          transactionType: 'RECEIPT',
          quantity: 50,
          referenceType: 'GOODS_RECEIPT',
          referenceId: 'test-receipt-id-2',
          referenceNumber: 'GR-202608-0002',
          notes: 'Test receipt to bin',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should get bin balance', async () => {
      if (!adminToken || !testItemId || !testLocationId) return;

      const response = await request(app)
        .get(`/api/inventory/bin/${testItemId}/${testLocationId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(50);
    });
  });
});
