import { Router } from 'express'
import { getAllInventory, getInventoryItem, createInventoryItem, updateInventoryItem } from '../controllers/inventoryController.js'

const router = Router()

router.get('/', getAllInventory)
router.get('/:id', getInventoryItem)
router.post('/', createInventoryItem)
router.put('/:id', updateInventoryItem)

export default router
