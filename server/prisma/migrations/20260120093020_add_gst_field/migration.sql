/*
  Warnings:

  - You are about to drop the column `tax` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "tax",
ADD COLUMN     "gst" DOUBLE PRECISION NOT NULL DEFAULT 0;
