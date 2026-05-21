-- Add SupportTicketStatus enum and support_tickets table
-- Run: pnpm prisma migrate deploy

CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

CREATE TABLE "support_tickets" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "subject"          TEXT NOT NULL,
  "message"          TEXT NOT NULL,
  "status"           "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "relatedUnlockId"  TEXT,
  "channel"          TEXT,
  "adminNotes"       TEXT,
  "resolvedAt"       TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_userId_createdAt_idx"
  ON "support_tickets"("userId", "createdAt");

CREATE INDEX "support_tickets_status_idx"
  ON "support_tickets"("status");

ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
