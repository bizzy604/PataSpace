/**
 * Purpose: Listing API functions for browsing and fetching listing details.
 * Why important: Centralises all listing HTTP calls so components don't embed fetch logic.
 * Used by: Discovery page, listing detail page, listings browse page.
 */
import type {
  ListingCard,
  ListingDetails,
  PaginatedListingsResponse,
  ListingFilters,
} from '@pataspace/contracts';
import { clientFetch, publicServerFetch, serverFetch } from './client';

/** Server component — fetch paginated listings without auth (public browse). */
export async function getListings(
  filters?: ListingFilters,
  page = 1,
  limit = 12,
): Promise<PaginatedListingsResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters?.minRent !== undefined) params.set('minRent', String(filters.minRent));
  if (filters?.maxRent !== undefined) params.set('maxRent', String(filters.maxRent));
  if (filters?.bedrooms !== undefined) params.set('bedrooms', String(filters.bedrooms));
  if (filters?.county) params.set('county', filters.county);
  if (filters?.neighborhood) params.set('neighborhood', filters.neighborhood);
  if (filters?.furnished !== undefined) params.set('furnished', String(filters.furnished));
  return publicServerFetch<PaginatedListingsResponse>(`/listings?${params.toString()}`);
}

/** Server component — fetch single listing; pass token to reveal contact info if unlocked. */
export async function getListingById(id: string, token?: string | null): Promise<ListingDetails> {
  if (token) {
    return serverFetch<ListingDetails>(`/listings/${id}`, token);
  }
  return publicServerFetch<ListingDetails>(`/listings/${id}`, 0);
}

/** Client hook helper — fetch listings client-side with optional auth. */
export async function fetchListings(
  getToken: () => Promise<string | null>,
  filters?: ListingFilters,
  page = 1,
): Promise<PaginatedListingsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: '12' });
  if (filters?.bedrooms !== undefined) params.set('bedrooms', String(filters.bedrooms));
  if (filters?.maxRent !== undefined) params.set('maxRent', String(filters.maxRent));
  if (filters?.neighborhood) params.set('neighborhood', filters.neighborhood);
  return clientFetch<PaginatedListingsResponse>(`/listings?${params.toString()}`, getToken);
}

/** Client hook helper — fetch listing cards for map/discovery view. */
export async function fetchListingCards(
  getToken: () => Promise<string | null>,
): Promise<ListingCard[]> {
  const result = await clientFetch<PaginatedListingsResponse>('/listings?limit=50', getToken);
  return result.data;
}
