-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_client_id_fkey";

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "hsn" TEXT NOT NULL DEFAULT '7116';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "buyer_address" TEXT,
ADD COLUMN     "buyer_contact" TEXT,
ADD COLUMN     "buyer_name" TEXT,
ADD COLUMN     "consignee_address" TEXT,
ADD COLUMN     "consignee_contact" TEXT,
ADD COLUMN     "consignee_name" TEXT,
ALTER COLUMN "client_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
