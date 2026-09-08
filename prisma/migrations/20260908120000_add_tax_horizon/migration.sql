-- Tax Horizon records are deliberately user-owned. They do not inherit the
-- shared workspace boundary used by CRM and enquiry records.
CREATE TYPE "TaxEntryType" AS ENUM ('ISSUED_INVOICE', 'CLIENT_REMITTANCE', 'EXPENSE_VAT');
CREATE TYPE "TaxLiabilityType" AS ENUM ('VAT', 'INCOME_TAX_PREPAYMENT', 'PRIOR_YEAR_SETTLEMENT', 'OTHER');
CREATE TYPE "TaxLiabilitySource" AS ENUM ('CALCULATED', 'ESTIMATE', 'TAX_NOTICE', 'ADVISER');
CREATE TYPE "TaxLiabilityStatus" AS ENUM ('ESTIMATED', 'NOTICE_RECEIVED', 'PAID');
CREATE TYPE "VatFilingFrequency" AS ENUM ('UNKNOWN', 'MONTHLY', 'QUARTERLY');

CREATE TABLE "TaxProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "reportingStartYear" INTEGER NOT NULL DEFAULT 2011,
    "vatFilingFrequency" "VatFilingFrequency" NOT NULL DEFAULT 'QUARTERLY',
    "hasPermanentExtension" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaxProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaxCashEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TaxEntryType" NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "vatAmount" DECIMAL(14,2) NOT NULL,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "vatRate" INTEGER,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "clientCalculated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaxCashEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaxLiability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TaxLiabilityType" NOT NULL,
    "source" "TaxLiabilitySource" NOT NULL DEFAULT 'ESTIMATE',
    "status" "TaxLiabilityStatus" NOT NULL DEFAULT 'ESTIMATED',
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "noticeDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "taxYear" INTEGER,
    "periodKey" TEXT,
    "calculationKey" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaxLiability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaxProfile_userId_key" ON "TaxProfile"("userId");
CREATE INDEX "TaxCashEntry_userId_paymentDate_idx" ON "TaxCashEntry"("userId", "paymentDate");
CREATE INDEX "TaxCashEntry_userId_type_idx" ON "TaxCashEntry"("userId", "type");
CREATE UNIQUE INDEX "TaxLiability_userId_calculationKey_key" ON "TaxLiability"("userId", "calculationKey");
CREATE INDEX "TaxLiability_userId_dueDate_idx" ON "TaxLiability"("userId", "dueDate");
CREATE INDEX "TaxLiability_userId_type_status_idx" ON "TaxLiability"("userId", "type", "status");

ALTER TABLE "TaxProfile" ADD CONSTRAINT "TaxProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaxCashEntry" ADD CONSTRAINT "TaxCashEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaxLiability" ADD CONSTRAINT "TaxLiability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
