-- Keep forecast and actual cash dates distinct, record the provenance of
-- AI-assisted extraction, and store daily work independently of tax totals.
ALTER TABLE "TaxCashEntry"
  ADD COLUMN "expectedPaymentDate" TIMESTAMP(3),
  ADD COLUMN "sourceFileName" TEXT,
  ADD COLUMN "sourceFileHash" TEXT,
  ADD COLUMN "extractionModel" TEXT,
  ADD COLUMN "aiExtracted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "WorkSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "taxCashEntryId" TEXT,
  "workDate" TIMESTAMP(3) NOT NULL,
  "hours" DECIMAL(6,2) NOT NULL,
  "activity" TEXT,
  "projectLabel" TEXT,
  "sourcePage" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkSession_userId_workDate_idx" ON "WorkSession"("userId", "workDate");
CREATE INDEX "WorkSession_taxCashEntryId_idx" ON "WorkSession"("taxCashEntryId");
CREATE UNIQUE INDEX "TaxCashEntry_userId_sourceFileHash_key" ON "TaxCashEntry"("userId", "sourceFileHash");

ALTER TABLE "WorkSession"
  ADD CONSTRAINT "WorkSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkSession"
  ADD CONSTRAINT "WorkSession_taxCashEntryId_fkey"
  FOREIGN KEY ("taxCashEntryId") REFERENCES "TaxCashEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
