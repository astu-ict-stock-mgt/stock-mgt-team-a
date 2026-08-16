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
- Prisma ORM
- PostgreSQL 16 (Docker for local dev)
- CORS enabled for cross-origin requests

## Project Structure

```
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReceiveStockModel19.jsx
│   │   │   └── IssueStockModel20.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios instance + API functions
│   │   └── utils/
│   │       └── formatters.js    # Currency, date, status helpers
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                     # Express API server
│   ├── prisma/
│   │   └── schema.prisma        # PostgreSQL schema
│   ├── .env.example             # DATABASE_URL template
│   └── src/
│       └── index.js             # Express server + health endpoint
│
├── utilities/                   # Dev infrastructure
│   ├── docker-compose.yml       # PostgreSQL container
│   └── .env.example             # DB credentials template
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### 1. Start PostgreSQL

```bash
cd utilities
docker compose up -d
```

This starts a PostgreSQL 16 container on `localhost:5432` with:
- User: `stockuser`
- Password: `stockpass`
- Database: `stock_management`

### 2. Setup Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

Backend runs on `http://localhost:3001`.

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

## Running Independently

Frontend and backend are decoupled. Each team can work independently:

```bash
# Frontend team
cd frontend && npm run dev

# Backend team
cd backend && npm run dev
```

## Using a Cloud Database

Teams using a cloud database (e.g., Supabase, Neon, Railway) just update `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |

> Additional endpoints will be added as the project develops.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://stockuser:stockpass@localhost:5432/stock_management` |
| `PORT` | Server port | `3001` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` (uses Vite proxy) |

To point at a remote backend:

```env
VITE_API_URL=https://your-backend-url/api
```

## Database Management

```bash
# Create migration after schema changes
npx prisma migrate dev --name <migration_name>

# Reset database
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Generate Prisma Client
npx prisma generate
```
