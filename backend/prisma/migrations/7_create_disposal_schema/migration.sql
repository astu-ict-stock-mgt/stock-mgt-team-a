-- CreateEnum: DisposalStatus
CREATE TYPE "DisposalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED');

-- CreateEnum: DisposalMethod
CREATE TYPE "DisposalMethod" AS ENUM ('AUCTION', 'DONATION', 'DESTRUCTION', 'RECYCLE', 'TRANSFER', 'WRITE_OFF');

-- CreateTable: disposal_requests
CREATE TABLE "disposal_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "status" "DisposalStatus" NOT NULL DEFAULT 'DRAFT',
    "disposal_method" "DisposalMethod" NOT NULL DEFAULT 'WRITE_OFF',
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "total_estimated_value" DECIMAL(65,30),
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "rejection_reason" TEXT,
    "executed_by" TEXT,
    "executed_at" TIMESTAMP(3),
    "execution_notes" TEXT,
    "witness_name" TEXT,
    "certificate_number" TEXT,
    "disposal_location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disposal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: disposal_request_lines
CREATE TABLE "disposal_request_lines" (
    "id" TEXT NOT NULL,
    "disposal_request_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(65,30),
    "total_cost" DECIMAL(65,30),
    "condition" TEXT,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disposal_request_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_disposal_line_quantity_positive" CHECK ("quantity" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "disposal_requests_request_number_key" ON "disposal_requests"("request_number");
CREATE INDEX "disposal_requests_request_number_idx" ON "disposal_requests"("request_number");
CREATE INDEX "disposal_requests_store_id_idx" ON "disposal_requests"("store_id");
CREATE INDEX "disposal_requests_requester_id_idx" ON "disposal_requests"("requester_id");
CREATE INDEX "disposal_requests_status_idx" ON "disposal_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_disposal_line_item" ON "disposal_request_lines"("disposal_request_id", "item_id");
CREATE INDEX "disposal_request_lines_disposal_request_id_idx" ON "disposal_request_lines"("disposal_request_id");
CREATE INDEX "disposal_request_lines_item_id_idx" ON "disposal_request_lines"("item_id");
CREATE INDEX "disposal_request_lines_location_id_idx" ON "disposal_request_lines"("location_id");

-- AddForeignKey
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposal_request_lines" ADD CONSTRAINT "disposal_request_lines_disposal_request_id_fkey" FOREIGN KEY ("disposal_request_id") REFERENCES "disposal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "disposal_request_lines" ADD CONSTRAINT "disposal_request_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disposal_request_lines" ADD CONSTRAINT "disposal_request_lines_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
