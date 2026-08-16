import { Router } from 'express'
import { getAllTransactions } from '../controllers/transactionController.js'

const router = Router()

router.get('/', getAllTransactions)

export default router
