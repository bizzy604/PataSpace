/**
 * Purpose: Listing API functions for the mobile app.
 * Why important: Centralises listing HTTP calls so screens don't embed fetch logic.
 * Used by: use-mobile-api-sync, ListingDetailsScreen.
 */
import type {
  ListingDetails,
  ListingFilters,
  MyListing,
  PaginatedListingsResponse,
  PaginatedMyListingsResponse,
} from '@pataspace/contracts';
import { apiFetch, publicFetch } from '../api-client';

export async function fetchListings(
  filters?: ListingFilters,
  page = 1,
): Promise<PaginatedListingsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (filters?.neighborhood) params.set('neighborhood', filters.neighborhood);
  if (filters?.bedrooms !== undefined) params.set('bedrooms', String(filters.bedrooms));
  if (filters?.maxRent !== undefined) params.set('maxRent', String(filters.maxRent));
  if (filters?.county) params.set('county', filters.county);
  return publicFetch<PaginatedListingsResponse>(`/listings?${params.toString()}`);
}

export async function fetchListingById(
  id: string,
  getToken: () => Promise<string | null>,
): Promise<ListingDetails> {
  return apiFetch<ListingDetails>(`/listings/${id}`, getToken);
}

export async function fetchMyListings(
  getToken: () => Promise<string | null>,
): Promise<MyListing[]> {
  const result = await apiFetch<PaginatedMyListingsResponse>('/listings/my-listings', getToken);
  return result.data;
}
