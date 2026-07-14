-- Support triage upgrade: ticket priority, assignment, and a message thread.
-- Backfills each existing ticket's original body as the first thread message.
-- Run: pnpm prisma migrate deploy

CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "support_tickets"
  ADD COLUMN "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "assignedToId" TEXT;

CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");
CREATE INDEX "support_tickets_assignedToId_idx" ON "support_tickets"("assignedToId");

ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "support_ticket_messages" (
  "id"         TEXT NOT NULL,
  "ticketId"   TEXT NOT NULL,
  "authorId"   TEXT NOT NULL,
  "authorRole" "Role" NOT NULL,
  "body"       TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_ticket_messages_ticketId_createdAt_idx"
  ON "support_ticket_messages"("ticketId", "createdAt");

ALTER TABLE "support_ticket_messages"
  ADD CONSTRAINT "support_ticket_messages_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_ticket_messages"
  ADD CONSTRAINT "support_ticket_messages_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the conversation with each ticket's existing body, authored by the
-- original reporter with their real role at migration time.
INSERT INTO "support_ticket_messages" ("id", "ticketId", "authorId", "authorRole", "body", "createdAt")
SELECT
  't_' || t."id",
  t."id",
  t."userId",
  u."role",
  t."message",
  t."createdAt"
FROM "support_tickets" t
JOIN "users" u ON u."id" = t."userId";
