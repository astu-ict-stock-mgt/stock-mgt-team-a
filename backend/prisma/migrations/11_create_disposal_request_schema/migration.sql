-- Migration 11: Create Disposal Request Schema (BE-136)
-- SRS Traceability: Section 11 (Disposal Module), Clarification Register C-13

-- CreateEnums
CREATE TYPE "DisposalMethod" AS ENUM ('AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLING', 'TRANSFER_OUT');
CREATE TYPE "DisposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'EVALUATED', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED');

-- CreateTable: disposal_requests
CREATE TABLE "disposal_requests" (
    "id" TEXT NOT NULL,
    "disposal_number" TEXT NOT NULL,
    "disposal_method" "DisposalMethod" NOT NULL,
    "status" "DisposalStatus" NOT NULL DEFAULT 'DRAFT',
    "store_id" TEXT,
    "requested_by" TEXT NOT NULL,
    "evaluated_by" TEXT,
    "evaluated_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "executed_by" TEXT,
    "executed_at" TIMESTAMP(3),
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disposal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "disposal_requests_disposal_number_key" ON "disposal_requests"("disposal_number");
CREATE INDEX "disposal_requests_disposal_number_idx" ON "disposal_requests"("disposal_number");
CREATE INDEX "disposal_requests_status_idx" ON "disposal_requests"("status");
CREATE INDEX "disposal_requests_store_id_idx" ON "disposal_requests"("store_id");
CREATE INDEX "disposal_requests_requested_by_idx" ON "disposal_requests"("requested_by");

-- AddForeignKeys
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_evaluated_by_fkey" FOREIGN KEY ("evaluated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
