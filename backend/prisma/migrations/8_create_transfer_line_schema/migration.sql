-- Migration 8: Create Transfer Lines Schema (BE-122)
-- SRS Traceability: Section 8 (Stock Transfer Module)

-- CreateTable: transfer_lines
CREATE TABLE "transfer_lines" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity_requested" INTEGER NOT NULL,
    "quantity_transferred" INTEGER DEFAULT 0,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "uq_transfer_line_item" ON "transfer_lines"("transfer_id", "item_id");
CREATE INDEX "transfer_lines_transfer_id_idx" ON "transfer_lines"("transfer_id");
CREATE INDEX "transfer_lines_item_id_idx" ON "transfer_lines"("item_id");

-- AddForeignKeys
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
