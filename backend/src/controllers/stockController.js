import { db } from '../models/database.js'

export const receiveStock = (req, res) => {
  try {
    const { itemId, quantity, supplier, unitPrice, notes } = req.body
    
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(itemId)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    const newQuantity = item.quantity + quantity
    const newUnitPrice = unitPrice || item.unitPrice

    db.prepare('UPDATE inventory SET quantity = ?, unitPrice = ? WHERE id = ?')
      .run(newQuantity, newUnitPrice, itemId)

    db.prepare(
      'INSERT INTO transactions (itemId, type, quantity, unitPrice, supplier, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(itemId, 'receive', quantity, newUnitPrice, supplier, notes || '')

    const updatedItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(itemId)
    res.json({ message: 'Stock received successfully', item: updatedItem })
  } catch (error) {
    res.status(500).json({ error: 'Failed to receive stock' })
  }
}

export const issueStock = (req, res) => {
  try {
    const { itemId, quantity, issuedTo, department, purpose } = req.body
    
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(itemId)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    if (item.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' })
    }

    const newQuantity = item.quantity - quantity

    db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?')
      .run(newQuantity, itemId)

    db.prepare(
      'INSERT INTO transactions (itemId, type, quantity, unitPrice, issuedTo, department, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(itemId, 'issue', quantity, item.unitPrice, issuedTo, department, purpose || '')

    const updatedItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(itemId)
    res.json({ message: 'Stock issued successfully', item: updatedItem })
  } catch (error) {
    res.status(500).json({ error: 'Failed to issue stock' })
  }
}
