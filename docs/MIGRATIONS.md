# Stock Management System (SMS) - Database Migration Guide

**Tool**: Prisma Migrate
**Task**: BE-011 (Configure Database Migration System)
**Rule**: No developer edits the PostgreSQL database by hand. All schema modifications must be created, tracked, and committed via Prisma Migrate.

---

## 1. How to Make Database Schema Changes

When you need to add or update a table in `prisma/schema.prisma`:

### Step 1: Update `schema.prisma`
Edit `backend/prisma/schema.prisma` to add or modify your model:
```prisma
model Store {
  id        String   @id @default(uuid())
  code      String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("stores")
}
```

### Step 2: Create a Local Migration
Run the following command in your terminal (`backend/` folder):
```powershell
npm run migrate:dev -- --name add_stores_table
```

This will:
1. Generate a new SQL migration file inside `prisma/migrations/<timestamp>_add_stores_table/migration.sql`.
2. Apply the migration to your local PostgreSQL database.
3. Re-generate the Prisma Client (`@prisma/client`).

### Step 3: Commit the Migration SQL File to Git
Always commit the generated `prisma/migrations/` folder into your feature branch!

---

## 2. Team Commands Quick Reference

| Command | Purpose |
| :--- | :--- |
| `npm run migrate:dev` | Create and apply a new migration during local development |
| `npm run migrate:deploy` | Apply pending migrations (used in CI/CD and deployment) |
| `npm run migrate:status` | Check if your local database is up to date with migrations |
