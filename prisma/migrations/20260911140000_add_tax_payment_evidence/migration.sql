-- Preserve the calculated liability, accountant-advised amount and actual bank
-- payment as separate values. Payment rows form an append-only evidence trail;
-- reopening a liability voids the row instead of deleting it.
CREATE TYPE "TaxPaymentSource" AS ENUM ('ADVISER', 'TAX_NOTICE', 'ELSTER', 'MANUAL');

CREATE TABLE "TaxPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxLiabilityId" TEXT,
    "type" "TaxLiabilityType" NOT NULL,
    "periodKey" TEXT,
    "periodLabel" TEXT NOT NULL,
    "calculatedAmount" DECIMAL(14,2) NOT NULL,
    "advisedAmount" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "source" "TaxPaymentSource" NOT NULL,
    "settlesPeriod" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaxPayment_userId_paidAt_idx" ON "TaxPayment"("userId", "paidAt");
CREATE INDEX "TaxPayment_userId_type_periodKey_idx" ON "TaxPayment"("userId", "type", "periodKey");
CREATE INDEX "TaxPayment_taxLiabilityId_idx" ON "TaxPayment"("taxLiabilityId");

ALTER TABLE "TaxPayment"
ADD CONSTRAINT "TaxPayment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaxPayment"
ADD CONSTRAINT "TaxPayment_taxLiabilityId_fkey"
FOREIGN KEY ("taxLiabilityId") REFERENCES "TaxLiability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
