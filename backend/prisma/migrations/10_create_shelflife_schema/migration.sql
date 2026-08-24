-- Migration 10: Create Shelf-Life Schema (BE-132)
-- SRS Traceability: Section 10 (Shelf-Life & Expiry Module), Clarification Register C-12

-- CreateEnum
CREATE TYPE "ShelfLifeStatus" AS ENUM ('HEALTHY', 'NEAR_EXPIRY', 'EXPIRED');

-- CreateTable: shelflife_records
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelflife_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "uq_shelflife_item_batch" ON "shelflife_records"("item_id", "batch_number");
CREATE INDEX "shelflife_records_item_id_idx" ON "shelflife_records"("item_id");
CREATE INDEX "shelflife_records_batch_number_idx" ON "shelflife_records"("batch_number");
CREATE INDEX "shelflife_records_expiry_date_idx" ON "shelflife_records"("expiry_date");
CREATE INDEX "shelflife_records_status_idx" ON "shelflife_records"("status");
CREATE INDEX "shelflife_records_store_id_idx" ON "shelflife_records"("store_id");

-- AddForeignKeys
ALTER TABLE "shelflife_records" ADD CONSTRAINT "shelflife_records_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shelflife_records" ADD CONSTRAINT "shelflife_records_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shelflife_records" ADD CONSTRAINT "shelflife_records_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
