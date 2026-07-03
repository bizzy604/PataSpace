-- Two-part pricing + trust patches (engineering spec v1.2):
--   * banded unlock credits + success fee snapshot on listings
--   * landlord-awareness attestation + poster role
--   * mover->poster seeded listings
--   * report-dead reason codes on unlocks
--   * success_fees settlement ledger
--   * proxy_sessions for the masked contact layer
-- Run: pnpm prisma:migrate:deploy

CREATE TYPE "PosterRole" AS ENUM ('OUTGOING_TENANT', 'CARETAKER', 'LANDLORD', 'SCOUT');

CREATE TYPE "UnlockDeadReason" AS ENUM ('OCCUPIED', 'FAKE', 'UNRESPONSIVE', 'LANDLORD_DECLINED');

CREATE TYPE "SuccessFeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'SETTLED');

CREATE TYPE "ProxySessionStatus" AS ENUM ('ACTIVE', 'EXPIRED');

ALTER TABLE "listings"
  ADD COLUMN "successFeeKes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "landlordAware" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "posterRole" "PosterRole" NOT NULL DEFAULT 'OUTGOING_TENANT',
  ADD COLUMN "seededFromConfirmationId" TEXT;

-- Backfill the success-fee snapshot for existing listings using the spec formula
-- clamp(10% x rent, 1000, 5000) so pre-patch listings keep working end to end.
UPDATE "listings"
SET "successFeeKes" = LEAST(GREATEST(ROUND("monthlyRent" * 0.10), 1000), 5000);

CREATE UNIQUE INDEX "listings_seededFromConfirmationId_key"
  ON "listings"("seededFromConfirmationId");

ALTER TABLE "unlocks"
  ADD COLUMN "deadReason" "UnlockDeadReason";

ALTER TABLE "confirmations"
  ADD COLUMN "posterPromptSmsAt" TIMESTAMP(3);

CREATE TABLE "success_fees" (
  "id"               TEXT NOT NULL,
  "unlockId"         TEXT NOT NULL,
  "listingId"        TEXT NOT NULL,
  "moverId"          TEXT NOT NULL,
  "feeDueKes"        INTEGER NOT NULL,
  "creditsApplied"   INTEGER NOT NULL DEFAULT 0,
  "cashCollectedKes" INTEGER NOT NULL DEFAULT 0,
  "status"           "SuccessFeeStatus" NOT NULL DEFAULT 'PENDING',
  "settledAt"        TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "success_fees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "success_fees_unlockId_key" ON "success_fees"("unlockId");

CREATE INDEX "success_fees_moverId_status_idx" ON "success_fees"("moverId", "status");

CREATE INDEX "success_fees_listingId_idx" ON "success_fees"("listingId");

ALTER TABLE "success_fees"
  ADD CONSTRAINT "success_fees_unlockId_fkey"
  FOREIGN KEY ("unlockId") REFERENCES "unlocks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "proxy_sessions" (
  "id"                    TEXT NOT NULL,
  "unlockId"              TEXT NOT NULL,
  "virtualMsisdn"         TEXT NOT NULL,
  "providerRef"           TEXT,
  "status"                "ProxySessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt"             TIMESTAMP(3) NOT NULL,
  "firstPosterResponseAt" TIMESTAMP(3),
  "callCount"             INTEGER NOT NULL DEFAULT 0,
  "lastCallAt"            TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,

  CONSTRAINT "proxy_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "proxy_sessions_unlockId_key" ON "proxy_sessions"("unlockId");

CREATE INDEX "proxy_sessions_virtualMsisdn_status_idx"
  ON "proxy_sessions"("virtualMsisdn", "status");

CREATE INDEX "proxy_sessions_status_expiresAt_idx"
  ON "proxy_sessions"("status", "expiresAt");

ALTER TABLE "proxy_sessions"
  ADD CONSTRAINT "proxy_sessions_unlockId_fkey"
  FOREIGN KEY ("unlockId") REFERENCES "unlocks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security: both tables hang off an unlock, so reuse the
-- participant helper installed by 20260325183000_add_row_level_security.
ALTER TABLE "success_fees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "success_fees" FORCE ROW LEVEL SECURITY;

CREATE POLICY success_fees_select_policy
ON "success_fees"
FOR SELECT
USING (app.can_access_participant_unlock("unlockId"));

CREATE POLICY success_fees_insert_policy
ON "success_fees"
FOR INSERT
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY success_fees_update_policy
ON "success_fees"
FOR UPDATE
USING (app.can_access_participant_unlock("unlockId"))
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY success_fees_delete_policy
ON "success_fees"
FOR DELETE
USING (app.is_privileged());

ALTER TABLE "proxy_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proxy_sessions" FORCE ROW LEVEL SECURITY;

CREATE POLICY proxy_sessions_select_policy
ON "proxy_sessions"
FOR SELECT
USING (app.can_access_participant_unlock("unlockId"));

CREATE POLICY proxy_sessions_insert_policy
ON "proxy_sessions"
FOR INSERT
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY proxy_sessions_update_policy
ON "proxy_sessions"
FOR UPDATE
USING (app.can_access_participant_unlock("unlockId"))
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY proxy_sessions_delete_policy
ON "proxy_sessions"
FOR DELETE
USING (app.is_privileged());
