-- Clerk removal (Docs/14 Phase 4). The clerkId column is vestigial: no
-- application code reads or writes it after Phases 1-3 decoupled auth from
-- Clerk. Dropping it removes only the unused identifier strings; no user
-- rows or other columns are affected. The other columns the original
-- add-clerk migration made nullable (phoneNumberHash, phoneNumberEncrypted,
-- passwordHash) are deliberately LEFT nullable — the app handles them
-- nullable at runtime and re-adding NOT NULL could fail on existing rows.

-- DropIndex
DROP INDEX "users_clerkId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "clerkId";
