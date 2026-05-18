-- Add PaymentMethod enum and Stellar fields to CreditTransaction
-- Run: pnpm prisma migrate deploy

CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'STELLAR');

ALTER TABLE "credit_transactions"
  ADD COLUMN "paymentMethod"          "PaymentMethod" NOT NULL DEFAULT 'MPESA',
  ADD COLUMN "stellarTransactionHash" TEXT;

CREATE UNIQUE INDEX "credit_transactions_stellarTransactionHash_key"
  ON "credit_transactions"("stellarTransactionHash");

CREATE INDEX "credit_transactions_paymentMethod_status_idx"
  ON "credit_transactions"("paymentMethod", "status");
