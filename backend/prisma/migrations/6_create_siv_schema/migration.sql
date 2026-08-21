-- CreateEnum: SIVStatus
CREATE TYPE "SIVStatus" AS ENUM ('DRAFT', 'PREPARED', 'APPROVED', 'FINALIZED', 'CANCELLED');

-- CreateTable: sivs
CREATE TABLE "sivs" (
    "id" TEXT NOT NULL,
    "siv_number" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "issued_to_user_id" TEXT NOT NULL,
    "status" "SIVStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prepared_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sivs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: siv_lines
CREATE TABLE "siv_lines" (
    "id" TEXT NOT NULL,
    "siv_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity_issued" INTEGER NOT NULL,
    "unit_cost" DECIMAL(65,30),
    "total_cost" DECIMAL(65,30),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siv_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_siv_line_quantity_issued_positive" CHECK ("quantity_issued" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "sivs_siv_number_key" ON "sivs"("siv_number");
CREATE INDEX "sivs_siv_number_idx" ON "sivs"("siv_number");
CREATE INDEX "sivs_requisition_id_idx" ON "sivs"("requisition_id");
CREATE INDEX "sivs_store_id_idx" ON "sivs"("store_id");
CREATE INDEX "sivs_status_idx" ON "sivs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_siv_line_item" ON "siv_lines"("siv_id", "item_id");
CREATE INDEX "siv_lines_siv_id_idx" ON "siv_lines"("siv_id");
CREATE INDEX "siv_lines_item_id_idx" ON "siv_lines"("item_id");

-- AddForeignKey
ALTER TABLE "sivs" ADD CONSTRAINT "sivs_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sivs" ADD CONSTRAINT "sivs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sivs" ADD CONSTRAINT "sivs_issued_to_user_id_fkey" FOREIGN KEY ("issued_to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sivs" ADD CONSTRAINT "sivs_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sivs" ADD CONSTRAINT "sivs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siv_lines" ADD CONSTRAINT "siv_lines_siv_id_fkey" FOREIGN KEY ("siv_id") REFERENCES "sivs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "siv_lines" ADD CONSTRAINT "siv_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
