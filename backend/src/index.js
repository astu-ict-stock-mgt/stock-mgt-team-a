import express from 'express'
import cors from 'cors'
import inventoryRoutes from './routes/inventory.js'
import stockRoutes from './routes/stock.js'
import transactionRoutes from './routes/transactions.js'
import { initializeDatabase } from './models/database.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/inventory', inventoryRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/transactions', transactionRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

initializeDatabase()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
