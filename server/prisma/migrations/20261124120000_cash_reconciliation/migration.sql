ALTER TABLE "CashSession"
ADD COLUMN "closingCardAmount" DECIMAL(12,2),
ADD COLUMN "closingDigitalAmount" DECIMAL(12,2),
ADD COLUMN "closingBitcoinAmount" DECIMAL(12,2),
ADD COLUMN "closingChivoWalletAmount" DECIMAL(12,2);

CREATE INDEX "CashSession_employeeId_status_openedAt_idx"
ON "CashSession"("employeeId", "status", "openedAt");
