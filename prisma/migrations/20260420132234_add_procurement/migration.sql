-- CreateEnum
CREATE TYPE "ProcurementCategory" AS ENUM ('LEGAL', 'ENGINEERING', 'FINANCIAL', 'IT', 'CONSTRUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('OPEN', 'DECIDED', 'CLOSED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('AWAITED', 'RECEIVED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('FIXED', 'HOURLY', 'DAILY', 'TBC');

-- CreateTable
CREATE TABLE "ProcurementProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ProcurementCategory" NOT NULL,
    "description" TEXT,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'OPEN',
    "decisionDeadline" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementSupplier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementQuote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'AWAITED',
    "feeAmount" DECIMAL(12,2),
    "feeCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "feeType" "FeeType" NOT NULL DEFAULT 'TBC',
    "servicesOffered" TEXT,
    "availability" TEXT,
    "experienceNotes" TEXT,
    "prosNotes" TEXT,
    "consNotes" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcurementProject_userId_status_idx" ON "ProcurementProject"("userId", "status");

-- CreateIndex
CREATE INDEX "ProcurementProject_decisionDeadline_idx" ON "ProcurementProject"("decisionDeadline");

-- CreateIndex
CREATE INDEX "ProcurementSupplier_userId_idx" ON "ProcurementSupplier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementSupplier_userId_name_key" ON "ProcurementSupplier"("userId", "name");

-- CreateIndex
CREATE INDEX "ProcurementQuote_projectId_idx" ON "ProcurementQuote"("projectId");

-- CreateIndex
CREATE INDEX "ProcurementQuote_supplierId_idx" ON "ProcurementQuote"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementQuote_projectId_supplierId_key" ON "ProcurementQuote"("projectId", "supplierId");

-- AddForeignKey
ALTER TABLE "ProcurementProject" ADD CONSTRAINT "ProcurementProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementSupplier" ADD CONSTRAINT "ProcurementSupplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProcurementProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ProcurementSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
