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
router.post('/transactions', authorize('inventory.post'), inventoryController.postTransaction)
router.get('/transactions/history', authorize('inventory.read'), inventoryController.getTransactionHistory)

// Stock Balance
router.get('/stock/:itemId/:storeId', authorize('inventory.read'), inventoryController.getStockBalance)
router.get('/stock/store/:storeId', authorize('inventory.read'), inventoryController.getStockByStore)
router.get('/stock/item/:itemId', authorize('inventory.read'), inventoryController.getStockByItem)
router.get('/stock/value/:storeId', authorize('inventory.read'), inventoryController.getStockValue)
router.get('/stock/low/:storeId', authorize('inventory.read'), inventoryController.getLowStockItems)

// Bin Balance
router.get('/bin/:itemId/:locationId', authorize('inventory.read'), inventoryController.getBinBalance)

// Movement Summary
router.get('/movements/:storeId', authorize('inventory.read'), inventoryController.getMovementSummary)

export default router
