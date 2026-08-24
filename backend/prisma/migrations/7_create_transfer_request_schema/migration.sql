-- Migration 7: Create Transfer Request Schema (BE-121)
-- SRS Traceability: Section 8 (Stock Transfer Module), Clarification Register C-10

-- CreateEnums
CREATE TYPE "TransferType" AS ENUM ('BIN_TO_BIN', 'STORE_TO_STORE', 'DEPT_TO_STORE', 'STORE_TO_DEPT');
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateTable: transfer_requests
CREATE TABLE "transfer_requests" (
    "id" TEXT NOT NULL,
    "transfer_number" TEXT NOT NULL,
    "transfer_type" "TransferType" NOT NULL DEFAULT 'STORE_TO_STORE',
    "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "source_store_id" TEXT NOT NULL,
    "destination_store_id" TEXT NOT NULL,
    "source_location_id" TEXT,
    "destination_location_id" TEXT,
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "transfer_requests_transfer_number_key" ON "transfer_requests"("transfer_number");
CREATE INDEX "transfer_requests_transfer_number_idx" ON "transfer_requests"("transfer_number");
CREATE INDEX "transfer_requests_source_store_id_idx" ON "transfer_requests"("source_store_id");
CREATE INDEX "transfer_requests_destination_store_id_idx" ON "transfer_requests"("destination_store_id");
CREATE INDEX "transfer_requests_status_idx" ON "transfer_requests"("status");

-- AddForeignKeys
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_store_id_fkey" FOREIGN KEY ("source_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_destination_store_id_fkey" FOREIGN KEY ("destination_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
