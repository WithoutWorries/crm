-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM (
  'FACT',
  'DECISION',
  'SOLUTION',
  'LESSON_LEARNED',
  'IDEA',
  'QUESTION',
  'CALCULATION',
  'REFERENCE',
  'OBSERVATION'
);

-- AlterTable
ALTER TABLE "Note"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "knowledgeType" "KnowledgeType",
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "isKnowledge" BOOLEAN NOT NULL DEFAULT false;

-- Recent knowledge is always read within one private user scope.
CREATE INDEX "Note_userId_isKnowledge_updatedAt_idx"
  ON "Note"("userId", "isKnowledge", "updatedAt");

-- PostgreSQL-native full-text search keeps retrieval fast without another service.
CREATE INDEX "Note_knowledge_search_idx"
  ON "Note"
  USING GIN (
    to_tsvector(
      'english',
      COALESCE("title", '') || ' ' || "content"
    )
  )
  WHERE "isKnowledge" = true;
