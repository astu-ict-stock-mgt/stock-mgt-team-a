import { db } from '../models/database.js'

export const getAllInventory = (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM inventory ORDER BY name').all()
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
}

export const getInventoryItem = (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' })
  }
}

export const createInventoryItem = (req, res) => {
  try {
    const { name, category, quantity, unitPrice, reorderLevel, description } = req.body
    const result = db.prepare(
      'INSERT INTO inventory (name, category, quantity, unitPrice, reorderLevel, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, category, quantity, unitPrice, reorderLevel || 10, description || '')
    
    const newItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(newItem)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' })
  }
}

export const updateInventoryItem = (req, res) => {
  try {
    const { name, category, quantity, unitPrice, reorderLevel, description } = req.body
    db.prepare(
      'UPDATE inventory SET name = ?, category = ?, quantity = ?, unitPrice = ?, reorderLevel = ?, description = ? WHERE id = ?'
    ).run(name, category, quantity, unitPrice, reorderLevel, description, req.params.id)
    
    const updatedItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id)
    res.json(updatedItem)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' })
  }
}
