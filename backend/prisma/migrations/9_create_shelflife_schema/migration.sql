-- PostgreSQL Migration: 9_create_shelflife_schema
-- Tasks: BE-132 (Create Shelf-Life Schema) & BE-133 (Shelf-Life Monitoring Service)
-- SRS Traceability: Section 10.1 (Core Entities: shelflife_records),
--                   FR-37 (expiry monitoring and alerts),
--                   Clarification C-12 (per-batch expiry tracking: HEALTHY, NEAR_EXPIRY, EXPIRED)

-- 1. Create Enum Type
CREATE TYPE "ShelfLifeStatus" AS ENUM (
  'HEALTHY',
  'NEAR_EXPIRY',
  'EXPIRED'
);

-- 2. Create Table
CREATE TABLE "shelflife_records" (
  "id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "batch_number" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "expiry_date" TIMESTAMP(3) NOT NULL,
  "alert_days_before_expiry" INTEGER NOT NULL DEFAULT 30,
  "status" "ShelfLifeStatus" NOT NULL DEFAULT 'HEALTHY',
  "store_id" TEXT,
  "location_id" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "shelflife_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_shelflife_quantity_non_negative" CHECK ("quantity" >= 0),
  CONSTRAINT "chk_shelflife_alert_days_positive" CHECK ("alert_days_before_expiry" >= 0)
);

-- 3. Create Unique & Performance Indexes
CREATE UNIQUE INDEX "uq_shelflife_item_batch" ON "shelflife_records"("item_id", "batch_number");
CREATE INDEX "shelflife_records_item_id_idx" ON "shelflife_records"("item_id");
CREATE INDEX "shelflife_records_batch_number_idx" ON "shelflife_records"("batch_number");
CREATE INDEX "shelflife_records_expiry_date_idx" ON "shelflife_records"("expiry_date");
CREATE INDEX "shelflife_records_status_idx" ON "shelflife_records"("status");
CREATE INDEX "shelflife_records_store_id_idx" ON "shelflife_records"("store_id");

-- 4. Foreign Key Constraints
ALTER TABLE "shelflife_records" ADD CONSTRAINT "shelflife_records_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shelflife_records" ADD CONSTRAINT "shelflife_records_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shelflife_records" ADD CONSTRAINT "shelflife_records_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
