/*
  Warnings:

  - You are about to drop the `system_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "system_settings";

-- CreateTable
CREATE TABLE "StockTaking" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTaking_pkey" PRIMARY KEY ("id")
);
