-- CreateEnum
CREATE TYPE "ListingHouseType" AS ENUM (
    'STUDIO',
    'BEDSITTER',
    'ONE_BEDROOM',
    'TWO_BEDROOM',
    'THREE_BEDROOM',
    'FOUR_BEDROOM_PLUS',
    'MANSION'
);

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "houseType" "ListingHouseType";

-- Backfill existing listings from the best available legacy fields
UPDATE "listings"
SET "houseType" = CASE
    WHEN LOWER("propertyType") IN ('bedsitter', 'bed sitter') THEN 'BEDSITTER'::"ListingHouseType"
    WHEN LOWER("propertyType") = 'studio' THEN 'STUDIO'::"ListingHouseType"
    WHEN LOWER("propertyType") = 'mansion' THEN 'MANSION'::"ListingHouseType"
    WHEN "bedrooms" >= 4 THEN 'FOUR_BEDROOM_PLUS'::"ListingHouseType"
    WHEN "bedrooms" = 3 THEN 'THREE_BEDROOM'::"ListingHouseType"
    WHEN "bedrooms" = 2 THEN 'TWO_BEDROOM'::"ListingHouseType"
    WHEN "bedrooms" = 1 THEN 'ONE_BEDROOM'::"ListingHouseType"
    ELSE 'STUDIO'::"ListingHouseType"
END;

-- Enforce the new required field after backfill
ALTER TABLE "listings" ALTER COLUMN "houseType" SET NOT NULL;
