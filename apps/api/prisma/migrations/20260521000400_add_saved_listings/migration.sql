-- Add saved_listings table
-- Run: pnpm prisma:migrate:deploy

CREATE TABLE "saved_listings" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_listings_userId_listingId_key"
  ON "saved_listings"("userId", "listingId");

CREATE INDEX "saved_listings_userId_createdAt_idx"
  ON "saved_listings"("userId", "createdAt");

CREATE INDEX "saved_listings_listingId_idx"
  ON "saved_listings"("listingId");

ALTER TABLE "saved_listings"
  ADD CONSTRAINT "saved_listings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_listings"
  ADD CONSTRAINT "saved_listings_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "listings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
