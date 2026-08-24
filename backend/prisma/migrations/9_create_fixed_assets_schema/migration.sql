-- Migration 9: Create Fixed Assets Schema (BE-129)
-- SRS Traceability: Section 9 (Fixed Assets Register), Clarification Register C-11

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('REGISTERED', 'IN_SERVICE', 'UNDER_MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF');

-- CreateTable: fixed_assets
CREATE TABLE "fixed_assets" (
    "id" TEXT NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "item_id" TEXT,
    "grn_id" TEXT,
    "serial_number" TEXT,
    "category" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'REGISTERED',
    "custodian_id" TEXT,
    "department_id" TEXT,
    "location_id" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_cost" DECIMAL(65,30),
    "current_value" DECIMAL(65,30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "fixed_assets_asset_tag_key" ON "fixed_assets"("asset_tag");
CREATE INDEX "fixed_assets_asset_tag_idx" ON "fixed_assets"("asset_tag");
CREATE INDEX "fixed_assets_status_idx" ON "fixed_assets"("status");
CREATE INDEX "fixed_assets_item_id_idx" ON "fixed_assets"("item_id");
CREATE INDEX "fixed_assets_custodian_id_idx" ON "fixed_assets"("custodian_id");
CREATE INDEX "fixed_assets_department_id_idx" ON "fixed_assets"("department_id");

-- AddForeignKeys
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "grns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_custodian_id_fkey" FOREIGN KEY ("custodian_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
