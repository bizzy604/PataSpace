-- Add ReferralStatus enum and referrals table
-- Run: pnpm prisma migrate deploy

CREATE TYPE "ReferralStatus" AS ENUM ('INVITED', 'JOINED', 'REWARDED', 'EXPIRED');

CREATE TABLE "referrals" (
  "id"                 TEXT NOT NULL,
  "referrerId"         TEXT NOT NULL,
  "inviteePhoneHash"   TEXT NOT NULL,
  "inviteePhoneMasked" TEXT NOT NULL,
  "code"               TEXT NOT NULL,
  "status"             "ReferralStatus" NOT NULL DEFAULT 'INVITED',
  "refereeUserId"      TEXT,
  "joinedAt"           TIMESTAMP(3),
  "rewardedAt"         TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referrals_code_key" ON "referrals"("code");

CREATE UNIQUE INDEX "referrals_referrerId_inviteePhoneHash_key"
  ON "referrals"("referrerId", "inviteePhoneHash");

CREATE INDEX "referrals_referrerId_createdAt_idx"
  ON "referrals"("referrerId", "createdAt");

CREATE INDEX "referrals_status_idx" ON "referrals"("status");

ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_refereeUserId_fkey"
  FOREIGN KEY ("refereeUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
