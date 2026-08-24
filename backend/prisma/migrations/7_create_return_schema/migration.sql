-- PostgreSQL Migration: 7_create_return_schema
-- Tasks: BE-115 (Create Return Lines Schema)

-- 1. Create Enum Types
CREATE TYPE "ReturnStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'PENDING_EVALUATION',
  'EVALUATED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED'
);

CREATE TYPE "ReturnDisposition" AS ENUM (
  'RESTOCK',
  'QUARANTINE',
  'REPAIR',
  'DISPOSAL',
  'REPLACEMENT'
);

-- 2. Create Returns Table (Store Return Note / SRN Header - BE-114)
CREATE TABLE "returns" (
  "id" TEXT NOT NULL,
  "return_number" TEXT NOT NULL,
  "siv_id" TEXT,
  "store_id" TEXT NOT NULL,
  "department_id" TEXT,
  "returned_by" TEXT NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
  "reason" TEXT NOT NULL,
  "return_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requires_evaluation" BOOLEAN NOT NULL DEFAULT false,
  "evaluated_by" TEXT,
  "evaluated_at" TIMESTAMP(3),
  "evaluation_remarks" TEXT,
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- 3. Create Return Lines Table (BE-115)
CREATE TABLE "return_lines" (
  "id" TEXT NOT NULL,
  "return_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "siv_line_id" TEXT,
  "quantity_returned" INTEGER NOT NULL,
  "unit_cost" DECIMAL(65,30),
  "total_cost" DECIMAL(65,30),
  "condition" TEXT,
  "disposition" "ReturnDisposition",
  "remarks" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "return_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_return_line_quantity_returned_positive" CHECK ("quantity_returned" > 0),
  CONSTRAINT "chk_return_line_unit_cost_non_negative" CHECK ("unit_cost" IS NULL OR "unit_cost" >= 0),
  CONSTRAINT "chk_return_line_total_cost_non_negative" CHECK ("total_cost" IS NULL OR "total_cost" >= 0)
);

-- 4. Create Unique Constraints & Indexes
CREATE UNIQUE INDEX "returns_return_number_key" ON "returns"("return_number");
CREATE INDEX "returns_return_number_idx" ON "returns"("return_number");
CREATE INDEX "returns_siv_id_idx" ON "returns"("siv_id");
CREATE INDEX "returns_store_id_idx" ON "returns"("store_id");
CREATE INDEX "returns_department_id_idx" ON "returns"("department_id");
CREATE INDEX "returns_returned_by_idx" ON "returns"("returned_by");
CREATE INDEX "returns_status_idx" ON "returns"("status");
CREATE INDEX "returns_return_date_idx" ON "returns"("return_date");

CREATE UNIQUE INDEX "uq_return_line_item" ON "return_lines"("return_id", "item_id");
CREATE INDEX "return_lines_return_id_idx" ON "return_lines"("return_id");
CREATE INDEX "return_lines_item_id_idx" ON "return_lines"("item_id");
CREATE INDEX "return_lines_siv_line_id_idx" ON "return_lines"("siv_line_id");
CREATE INDEX "return_lines_disposition_idx" ON "return_lines"("disposition");

-- 5. Foreign Key Constraints
ALTER TABLE "returns" ADD CONSTRAINT "returns_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_returned_by_fkey" FOREIGN KEY ("returned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_evaluated_by_fkey" FOREIGN KEY ("evaluated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_siv_id_fkey" FOREIGN KEY ("siv_id") REFERENCES "sivs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "return_lines" ADD CONSTRAINT "return_lines_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_lines" ADD CONSTRAINT "return_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_lines" ADD CONSTRAINT "return_lines_siv_line_id_fkey" FOREIGN KEY ("siv_line_id") REFERENCES "siv_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
