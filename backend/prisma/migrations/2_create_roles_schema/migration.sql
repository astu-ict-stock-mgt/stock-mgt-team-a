-- Create Roles Table Migration
-- Task: BE-022 (Create Roles Schema)
-- SRS Traceability: Section 10.1 (Core Entities), Appendix C (Role Matrix)

-- Create Table: roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "security_level" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index: roles_code_key
CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_key" ON "roles"("code");
