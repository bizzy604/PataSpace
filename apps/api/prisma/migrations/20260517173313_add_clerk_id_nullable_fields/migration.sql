-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clerkId" TEXT,
ALTER COLUMN "phoneNumberHash" DROP NOT NULL,
ALTER COLUMN "phoneNumberEncrypted" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");
