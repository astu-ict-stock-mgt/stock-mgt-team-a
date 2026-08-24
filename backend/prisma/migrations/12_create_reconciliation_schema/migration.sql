-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" TEXT NOT NULL,
    "reconciliation_no" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'DRAFT',
    "count_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    "initiated_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "posted_by" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_lines" (
    "id" TEXT NOT NULL,
    "reconciliation_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT,
    "system_quantity" INTEGER NOT NULL,
    "physical_count" INTEGER NOT NULL,
    "variance" INTEGER NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(65,30),
    "variance_value" DECIMAL(65,30),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_reconciliation_no_key" ON "reconciliations"("reconciliation_no");
CREATE INDEX "reconciliations_reconciliation_no_idx" ON "reconciliations"("reconciliation_no");
CREATE INDEX "reconciliations_status_idx" ON "reconciliations"("status");
CREATE INDEX "reconciliations_store_id_idx" ON "reconciliations"("store_id");
CREATE INDEX "reconciliations_initiated_by_idx" ON "reconciliations"("initiated_by");

-- CreateIndex
CREATE INDEX "reconciliation_lines_reconciliation_id_idx" ON "reconciliation_lines"("reconciliation_id");
CREATE INDEX "reconciliation_lines_item_id_idx" ON "reconciliation_lines"("item_id");
CREATE INDEX "reconciliation_lines_location_id_idx" ON "reconciliation_lines"("location_id");
CREATE UNIQUE INDEX "uq_reconciliation_line_item" ON "reconciliation_lines"("reconciliation_id", "item_id");

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_lines" ADD CONSTRAINT "reconciliation_lines_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reconciliation_lines" ADD CONSTRAINT "reconciliation_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reconciliation_lines" ADD CONSTRAINT "reconciliation_lines_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
