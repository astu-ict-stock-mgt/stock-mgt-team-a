import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = new Database(join(__dirname, '..', '..', 'stock.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unitPrice REAL NOT NULL DEFAULT 0,
      reorderLevel INTEGER NOT NULL DEFAULT 10,
      description TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('receive', 'issue')),
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      supplier TEXT,
      issuedTo TEXT,
      department TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (itemId) REFERENCES inventory(id)
    );
  `)

  const count = db.prepare('SELECT COUNT(*) as count FROM inventory').get()
  if (count.count === 0) {
    seedDatabase()
  }
}

const seedDatabase = () => {
  const insert = db.prepare(
    'INSERT INTO inventory (name, category, quantity, unitPrice, reorderLevel, description) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const items = [
    ['Laptop - Dell XPS 15', 'Electronics', 25, 1299.99, 5, 'High-performance laptop for development'],
    ['Wireless Mouse', 'Accessories', 150, 29.99, 20, 'Ergonomic wireless mouse'],
    ['USB-C Hub', 'Accessories', 75, 49.99, 15, '7-in-1 USB-C hub'],
    ['Monitor - 27" 4K', 'Electronics', 30, 449.99, 5, 'Ultra HD monitor'],
    ['Keyboard - Mechanical', 'Accessories', 100, 89.99, 10, 'RGB mechanical keyboard'],
    ['Webcam HD', 'Electronics', 40, 69.99, 8, '1080p HD webcam'],
    ['Headset with Mic', 'Electronics', 55, 79.99, 10, 'Noise-cancelling headset'],
    ['Desk Lamp', 'Furniture', 60, 34.99, 10, 'LED adjustable desk lamp'],
    ['Office Chair', 'Furniture', 15, 299.99, 3, 'Ergonomic office chair'],
    ['Whiteboard Markers', 'Supplies', 200, 5.99, 30, 'Set of 12 colored markers'],
  ]

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(...item)
    }
  })

  insertMany(items)
  console.log('Database seeded with initial inventory data')
}

export { db }
