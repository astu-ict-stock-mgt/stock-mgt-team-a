-- Create Permissions Table Migration
-- Task: BE-023 (Create Permissions Schema)
-- SRS Traceability: Section 10.1 (Core Entities), Appendix C (Atomic Permission Matrix)

-- Create Table: permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index: permissions_code_key
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_code_key" ON "permissions"("code");
