-- CreateEnum
CREATE TYPE "UploadMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "uploaded_assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cdnUrl" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mediaType" "UploadMediaType" NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_assets_storageKey_key" ON "uploaded_assets"("storageKey");

-- CreateIndex
CREATE INDEX "uploaded_assets_userId_mediaType_createdAt_idx" ON "uploaded_assets"("userId", "mediaType", "createdAt");

-- CreateIndex
CREATE INDEX "uploaded_assets_confirmedAt_idx" ON "uploaded_assets"("confirmedAt");

-- AddForeignKey
ALTER TABLE "uploaded_assets" ADD CONSTRAINT "uploaded_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
