# Stock Management System

A full-stack web application for managing inventory, tracking stock movements, and handling warehouse operations.

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- React Router v6 for navigation
- Axios for API requests

**Backend:**
- Node.js with Express
- better-sqlite3 for database
- CORS enabled for cross-origin requests

## Project Structure

```
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.jsx       # Navigation bar with route links
│   │   │   ├── StatsCard.jsx    # Dashboard statistics display
│   │   │   └── InventoryTable.jsx  # Tabular inventory view
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main overview with stats + table
│   │   │   ├── ReceiveStockModel19.jsx  # Stock receiving form
│   │   │   └── IssueStockModel20.jsx    # Stock issuing form
│   │   ├── services/
│   │   │   └── api.js           # Axios instance + API functions
│   │   └── utils/
│   │       └── formatters.js    # Currency, date, status helpers
│   ├── vite.config.js           # Dev server + API proxy
│   └── tailwind.config.js
│
├── backend/                     # Express API server
│   └── src/
│       ├── index.js             # Server entry, middleware, routes
│       ├── routes/
│       │   ├── inventory.js     # GET/POST/PUT /api/inventory
│       │   ├── stock.js         # POST /api/stock/receive|issue
│       │   └── transactions.js  # GET /api/transactions
│       ├── controllers/
│       │   ├── inventoryController.js  # CRUD operations
│       │   ├── stockController.js      # Receive/issue logic
│       │   └── transactionController.js
│       ├── models/
│       │   └── database.js      # SQLite schema + seed data
│       └── mock-data/
│           ├── inventory.json   # Sample inventory items
│           └── transactions.json # Sample transactions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/inventory | List all inventory items |
| GET | /api/inventory/:id | Get single item |
| POST | /api/inventory | Create new item |
| PUT | /api/inventory/:id | Update item |
| POST | /api/stock/receive | Add stock to inventory |
| POST | /api/stock/issue | Deduct stock from inventory |
| GET | /api/transactions | List all transactions |

## Database Schema

**inventory table:**
- id, name, category, quantity, unitPrice, reorderLevel, description, timestamps

**transactions table:**
- id, itemId (FK), type (receive/issue), quantity, unitPrice, supplier, issuedTo, department, notes, timestamp

## Getting Started

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3001`.

The database auto-creates and seeds with 10 sample items on first run.
