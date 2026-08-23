-- PostgreSQL Migration: 8_create_transfer_schema
-- Tasks: BE-127 (Transfer Validation)


-- 1. Create Enum Types
CREATE TYPE "TransferType" AS ENUM (
  'STORE_TO_STORE',
  'BIN_TO_BIN',
  'STORE_TO_DEPT',
  'DEPT_TO_STORE'
);

CREATE TYPE "TransferStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED'
);

-- 2. Create Transfer Requests Table (BE-121)
CREATE TABLE "transfer_requests" (
  "id" TEXT NOT NULL,
  "transfer_number" TEXT NOT NULL,
  "transfer_type" "TransferType" NOT NULL DEFAULT 'STORE_TO_STORE',
  "source_store_id" TEXT,
  "destination_store_id" TEXT,
  "source_location_id" TEXT,
  "destination_location_id" TEXT,
  "source_department_id" TEXT,
  "destination_department_id" TEXT,
  "requested_by" TEXT NOT NULL,
  "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
  "reason" TEXT NOT NULL,
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "executed_by" TEXT,
  "executed_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
);

-- 3. Create Transfer Lines Table (BE-122)
CREATE TABLE "transfer_lines" (
  "id" TEXT NOT NULL,
  "transfer_request_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "source_location_id" TEXT,
  "destination_location_id" TEXT,
  "remarks" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "transfer_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_transfer_line_quantity_positive" CHECK ("quantity" > 0)
);

-- 4. Create Unique Constraints & Indexes
CREATE UNIQUE INDEX "transfer_requests_transfer_number_key" ON "transfer_requests"("transfer_number");
CREATE INDEX "transfer_requests_transfer_number_idx" ON "transfer_requests"("transfer_number");
CREATE INDEX "transfer_requests_source_store_id_idx" ON "transfer_requests"("source_store_id");
CREATE INDEX "transfer_requests_destination_store_id_idx" ON "transfer_requests"("destination_store_id");
CREATE INDEX "transfer_requests_source_location_id_idx" ON "transfer_requests"("source_location_id");
CREATE INDEX "transfer_requests_destination_location_id_idx" ON "transfer_requests"("destination_location_id");
CREATE INDEX "transfer_requests_requested_by_idx" ON "transfer_requests"("requested_by");
CREATE INDEX "transfer_requests_status_idx" ON "transfer_requests"("status");

CREATE UNIQUE INDEX "uq_transfer_line_item" ON "transfer_lines"("transfer_request_id", "item_id");
CREATE INDEX "transfer_lines_transfer_request_id_idx" ON "transfer_lines"("transfer_request_id");
CREATE INDEX "transfer_lines_item_id_idx" ON "transfer_lines"("item_id");

-- 5. Foreign Key Constraints
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_store_id_fkey" FOREIGN KEY ("source_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_destination_store_id_fkey" FOREIGN KEY ("destination_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_department_id_fkey" FOREIGN KEY ("source_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_destination_department_id_fkey" FOREIGN KEY ("destination_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
