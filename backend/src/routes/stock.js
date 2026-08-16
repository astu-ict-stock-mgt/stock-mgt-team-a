import { Router } from 'express'
import { receiveStock, issueStock } from '../controllers/stockController.js'

const router = Router()

router.post('/receive', receiveStock)
router.post('/issue', issueStock)

export default router
