-- Knowledge notes use a recoverable 30-day deletion window. The field is
-- nullable so existing notes and non-Knowledge CRM notes remain unchanged.
ALTER TABLE "Note"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Note_userId_isKnowledge_deletedAt_idx"
ON "Note"("userId", "isKnowledge", "deletedAt");
