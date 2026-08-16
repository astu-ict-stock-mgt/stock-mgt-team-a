import { db } from '../models/database.js'

export const getAllTransactions = (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT t.*, i.name as itemName 
      FROM transactions t 
      LEFT JOIN inventory i ON t.itemId = i.id 
      ORDER BY t.createdAt DESC
    `).all()
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
}
