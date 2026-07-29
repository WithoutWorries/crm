-- Make locally queued Knowledge capture retries idempotent and retain the
-- original device capture time.

ALTER TABLE "Note"
ADD COLUMN "clientCaptureId" TEXT,
ADD COLUMN "capturedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Note_userId_clientCaptureId_key"
ON "Note"("userId", "clientCaptureId");
