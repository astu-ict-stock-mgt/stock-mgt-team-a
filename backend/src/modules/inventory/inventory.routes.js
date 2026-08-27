/**
 * Inventory & Valuation Router
 * Tasks: BE-085, BE-094, BE-148 (Implement Inventory Valuation API)
 */

import { Router } from 'express'
import inventoryController from './inventory.controller.js'
import { getValuationReport } from './valuation.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/rbac.middleware.js'
import { PERMISSIONS } from '../../config/rbac.js'

const router = Router()

router.use(authenticate)

/**
 * @openapi
 * /inventory/valuation:
 *   get:
 *     summary: Generate inventory valuation report with store/category breakdowns
 *     tags:
 *       - Inventory & Reporting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory valuation report returned with total quantity and monetary valuation breakdown
 */
router.get('/valuation', authorize(PERMISSIONS.REPORTS_VIEW), getValuationReport)

// Transaction Posting
router.post('/transactions', authorize(PERMISSIONS.INVENTORY_POST), inventoryController.postTransaction)
router.get('/transactions/history', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getTransactionHistory)

// Stock Balance
router.get('/stock/store/:storeId', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getStockByStore)
router.get('/stock/item/:itemId', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getStockByItem)
router.get('/stock/value/:storeId', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getStockValue)
router.get('/stock/low/:storeId', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getLowStockItems)
router.get('/stock/:itemId/:storeId', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getStockBalance)

// Bin Balance
router.get('/bin/:itemId/:locationId', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getBinBalance)

// Movement Summary
router.get('/movements/:storeId', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getMovementSummary)

export default router
