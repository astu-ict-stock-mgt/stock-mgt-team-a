import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Receiving/Evaluation Integration Tests', () => {
  let adminToken;
  let testSupplierId;
  let testStoreId;
  let testItemId;
  let testUnitId;
  let testReceiptId;
  let testEvaluationId;
  let testGRNId;

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
          code: 'TEST-UOM',
          name: 'Test Unit',
          symbol: 'TU',
        });
      if (unitResponse.status === 201) {
        testUnitId = unitResponse.body.data.id;
      }

      // Create supplier
      const supplierResponse = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-SUP-EVAL',
          name: 'Test Supplier for Evaluation',
          type: 'COMPANY',
        });
      if (supplierResponse.status === 201) {
        testSupplierId = supplierResponse.body.data.id;
      }

      // Create store
      const storeResponse = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'TEST-STORE-EVAL',
          name: 'Test Store for Evaluation',
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
            code: 'TEST-ITEM-EVAL',
            name: 'Test Item for Evaluation',
            unitId: testUnitId,
          });
        if (itemResponse.status === 201) {
          testItemId = itemResponse.body.data.id;
        }
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testReceiptId) {
      await prisma.goodsReceiptLine.deleteMany({ where: { goodsReceiptId: testReceiptId } });
      await prisma.goodsReceipt.delete({ where: { id: testReceiptId } }).catch(() => {});
    }
    if (testItemId) await prisma.item.delete({ where: { id: testItemId } }).catch(() => {});
    if (testUnitId) await prisma.unit.delete({ where: { id: testUnitId } }).catch(() => {});
    if (testSupplierId) await prisma.supplier.delete({ where: { id: testSupplierId } }).catch(() => {});
    if (testStoreId) await prisma.store.delete({ where: { id: testStoreId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Goods Receipt Flow', () => {
    it('should create a goods receipt', async () => {
      if (!adminToken || !testSupplierId || !testStoreId || !testItemId || !testUnitId) return;

      const response = await request(app)
        .post('/api/goods-receipts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplierId: testSupplierId,
          storeId: testStoreId,
          lines: [
            {
              itemId: testItemId,
              unitId: testUnitId,
              quantity: 100,
              unitCost: 25.50,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testReceiptId = response.body.data.id;
    });

    it('should get goods receipt by id', async () => {
      if (!adminToken || !testReceiptId) return;

      const response = await request(app)
        .get(`/api/goods-receipts/${testReceiptId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testReceiptId);
    });

    it('should transition to PENDING_EVALUATION', async () => {
      if (!adminToken || !testReceiptId) return;

      const response = await request(app)
        .patch(`/api/goods-receipts/${testReceiptId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PENDING_EVALUATION' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Evaluation Flow', () => {
    it('should create evaluation', async () => {
      if (!adminToken || !testReceiptId) return;

      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          goodsReceiptId: testReceiptId,
          notes: 'Initial evaluation',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testEvaluationId = response.body.data.id;
    });

    it('should start evaluation', async () => {
      if (!adminToken || !testEvaluationId) return;

      const response = await request(app)
        .patch(`/api/evaluations/${testEvaluationId}/start`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should approve evaluation', async () => {
      if (!adminToken || !testEvaluationId) return;

      const response = await request(app)
        .patch(`/api/evaluations/${testEvaluationId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVED' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GRN Flow', () => {
    it('should create GRN', async () => {
      if (!adminToken || !testReceiptId) return;

      const response = await request(app)
        .post('/api/grns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          goodsReceiptId: testReceiptId,
          notes: 'GRN for approved receipt',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testGRNId = response.body.data.id;
    });

    it('should finalize GRN', async () => {
      if (!adminToken || !testGRNId) return;

      const response = await request(app)
        .patch(`/api/grns/${testGRNId}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
