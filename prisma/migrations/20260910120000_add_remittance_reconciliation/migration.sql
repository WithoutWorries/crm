-- Keep the remittance's stated figures separate from the amount that reached the bank.
ALTER TABLE "TaxCashEntry"
  ADD COLUMN "bankedGrossAmount" DECIMAL(14,2),
  ADD COLUMN "cashDiscountRate" DECIMAL(5,2),
  ADD COLUMN "cashDiscountDays" INTEGER,
  ADD COLUMN "reconciliationNote" TEXT;
