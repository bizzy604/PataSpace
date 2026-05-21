-- Add ReviewerSide enum and unlock_reviews table
-- Run: pnpm prisma migrate deploy

CREATE TYPE "ReviewerSide" AS ENUM ('INCOMING_TENANT', 'OUTGOING_TENANT');

CREATE TABLE "unlock_reviews" (
  "id"         TEXT NOT NULL,
  "unlockId"   TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "side"       "ReviewerSide" NOT NULL,
  "rating"     INTEGER NOT NULL,
  "comment"    TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "unlock_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "unlock_reviews_unlockId_reviewerId_key"
  ON "unlock_reviews"("unlockId", "reviewerId");

CREATE INDEX "unlock_reviews_unlockId_idx"
  ON "unlock_reviews"("unlockId");

CREATE INDEX "unlock_reviews_reviewerId_idx"
  ON "unlock_reviews"("reviewerId");

ALTER TABLE "unlock_reviews"
  ADD CONSTRAINT "unlock_reviews_unlockId_fkey"
  FOREIGN KEY ("unlockId") REFERENCES "unlocks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unlock_reviews"
  ADD CONSTRAINT "unlock_reviews_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
