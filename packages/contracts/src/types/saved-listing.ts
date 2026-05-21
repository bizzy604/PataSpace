/**
 * Purpose: Saved-listing contract types shared between API, mobile, and web.
 * Why important: Drives the tenant "Saved" tab — same payload everywhere so a
 *   client can decide to render a thumbnail card with the original listing
 *   data plus the saved-at timestamp.
 * Used by: apps/api saved-listing module, mobile MobileAppProvider saved
 *   actions, web /saved page.
 */
import type { ListingCard } from './listing';

export type SavedListingRecord = {
  id: string;
  listing: ListingCard;
  createdAt: string;
};

export type SavedListingsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedSavedListingsResponse = {
  data: SavedListingRecord[];
  pagination: SavedListingsPagination;
};

export type SaveListingRequest = {
  listingId: string;
};

export type SaveListingResponse = SavedListingRecord;
