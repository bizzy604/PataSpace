/**
 * Purpose: Transport types for the admin listing CRUD endpoints
 *   (GET /admin/listings, PATCH /admin/listings/:id, DELETE /admin/listings/:id).
 * Why important: Shared contract between the admin console in apps/web and the
 *   API's admin module. Moderation types (pending queue, approve/reject) stay
 *   in types/admin.ts; these cover the full-catalogue CRUD surface.
 * Used by: apps/api modules/admin, apps/web /admin section.
 */
import { ListingHouseType, ListingStatus } from '../enums';
import { PaginationMeta } from './common';

export type AdminListingSummary = {
  id: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  county: string;
  neighborhood: string;
  monthlyRent: number;
  houseType: ListingHouseType;
  status: ListingStatus;
  isApproved: boolean;
  isDeleted: boolean;
  viewCount: number;
  unlockCount: number;
  unlockCostCredits: number;
  commission: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminListingsResponse = {
  data: AdminListingSummary[];
  meta: PaginationMeta;
};

export type AdminUpdateListingRequest = Partial<{
  county: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  houseType: ListingHouseType;
  propertyType: string;
  furnished: boolean;
  description: string;
  amenities: string[];
  propertyNotes: string | null;
  unlockCostCredits: number;
  commission: number;
  availableFrom: string;
  availableTo: string | null;
}>;

export type AdminDeleteListingRequest = {
  reason?: string;
};
