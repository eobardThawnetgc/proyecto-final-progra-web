BEGIN;

ALTER TABLE "PurchaseDetail" ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(14,6);

CREATE TABLE "PurchasePayment" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imported" BOOLEAN NOT NULL DEFAULT false,
    "reversesId" INTEGER,
    "reason" TEXT,
    CONSTRAINT "PurchasePayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PurchasePayment_reversesId_key" ON "PurchasePayment"("reversesId");
CREATE INDEX "PurchasePayment_purchaseId_id_idx" ON "PurchasePayment"("purchaseId", "id");

ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "PurchasePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Los pagos anteriores solo tenían un importe acumulado.
INSERT INTO "PurchasePayment" ("purchaseId", "amount", "imported")
SELECT "id", "paidAmount", true FROM "Purchase" WHERE "paidAmount" > 0;

COMMIT;
