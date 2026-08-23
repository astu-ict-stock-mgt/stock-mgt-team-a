-- PostgreSQL Migration: 5_create_requisitions_schema
-- Task: BE-096 (Create Requisition Schema)
-- SRS Traceability: Section 10.1 (Core Entities), Section 6 (Requisition & Issue Module), Clarification C-01

-- 1. Create Enum Type RequisitionStatus
CREATE TYPE "RequisitionStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'DEPARTMENT_APPROVED',
  'DEPARTMENT_REJECTED',
  'PAO_APPROVED',
  'PAO_REJECTED',
  'CANCELLED',
  'COMPLETED',
  'PARTIALLY_ISSUED'
);

-- 2. Create Requisitions Table
CREATE TABLE "requisitions" (
  "id" TEXT NOT NULL,
  "requisition_number" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "department_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
  "purpose" TEXT NOT NULL,
  "rejection_reason" TEXT,
  "department_approved_at" TIMESTAMP(3),
  "department_approved_by" TEXT,
  "pao_approved_at" TIMESTAMP(3),
  "pao_approved_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- 3. Create Requisition Lines Table
CREATE TABLE "requisition_lines" (
  "id" TEXT NOT NULL,
  "requisition_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "requested_quantity" INTEGER NOT NULL,
  "approved_quantity" INTEGER,
  "issued_quantity" INTEGER NOT NULL DEFAULT 0,
  "remarks" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "requisition_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_requested_quantity_positive" CHECK ("requested_quantity" > 0),
  CONSTRAINT "chk_issued_quantity_non_negative" CHECK ("issued_quantity" >= 0)
);

-- 4. Create Unique Constraints & Indexes
CREATE UNIQUE INDEX "requisitions_requisition_number_key" ON "requisitions"("requisition_number");
CREATE INDEX "requisitions_requisition_number_idx" ON "requisitions"("requisition_number");
CREATE INDEX "requisitions_requester_id_idx" ON "requisitions"("requester_id");
CREATE INDEX "requisitions_department_id_idx" ON "requisitions"("department_id");
CREATE INDEX "requisitions_store_id_idx" ON "requisitions"("store_id");
CREATE INDEX "requisitions_status_idx" ON "requisitions"("status");

CREATE INDEX "requisition_lines_requisition_id_idx" ON "requisition_lines"("requisition_id");
CREATE INDEX "requisition_lines_item_id_idx" ON "requisition_lines"("item_id");

-- 5. Foreign Key Constraints
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_department_approved_by_fkey" FOREIGN KEY ("department_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_pao_approved_by_fkey" FOREIGN KEY ("pao_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "requisition_lines" ADD CONSTRAINT "requisition_lines_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "requisition_lines" ADD CONSTRAINT "requisition_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
