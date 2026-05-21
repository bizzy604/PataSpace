-- Add OriginatorConversationID idempotency key to commissions
-- Run: pnpm prisma migrate deploy

ALTER TABLE "commissions"
  ADD COLUMN "originatorConversationId" TEXT;

CREATE UNIQUE INDEX "commissions_originatorConversationId_key"
  ON "commissions"("originatorConversationId");
