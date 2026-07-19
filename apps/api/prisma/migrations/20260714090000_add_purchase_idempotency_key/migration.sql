-- Purchase idempotency (money-correctness phase 3, audit finding H2):
-- every money-creating request carries a client Idempotency-Key; the unique
-- constraint is the atomic dedupe — a same-key retry collides here and gets
-- the stored result instead of a second charge. NULL keys stay allowed for
-- non-purchase movement rows (Postgres treats NULLs as distinct).
-- Run: pnpm prisma:migrate:deploy

ALTER TABLE "credit_transactions" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "credit_transactions_userId_idempotencyKey_key"
  ON "credit_transactions"("userId", "idempotencyKey");
