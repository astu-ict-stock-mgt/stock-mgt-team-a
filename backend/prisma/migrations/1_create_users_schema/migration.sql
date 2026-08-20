-- Create Users Table & Status Enum Migration
-- Task: BE-021 (Create Users Schema)
-- SRS Traceability: Section 10.1 (Core Entities), FR-01, BR-21

-- Create Enum: UserStatus
DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Table: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index: users_email_key
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
