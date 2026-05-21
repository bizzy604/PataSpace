/**
 * Purpose: Saved-listings API client for the mobile app.
 * Why important: Routes save/unsave/list calls to /me/saved-listings so the
 *   tenant's Saved tab persists across devices.
 * Used by: MobileAppProvider (toggleSaved, refresh on auth).
 */
import type {
  PaginatedSavedListingsResponse,
  SaveListingRequest,
  SaveListingResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function fetchMySavedListings(
  getToken: () => Promise<string | null>,
  page = 1,
  limit = 50,
): Promise<PaginatedSavedListingsResponse> {
  return apiFetch<PaginatedSavedListingsResponse>(
    `/me/saved-listings?page=${page}&limit=${limit}`,
    getToken,
  );
}

export async function saveListing(
  getToken: () => Promise<string | null>,
  listingId: string,
): Promise<SaveListingResponse> {
  return apiFetch<SaveListingResponse>('/me/saved-listings', getToken, {
    method: 'POST',
    body: JSON.stringify({ listingId } satisfies SaveListingRequest),
  });
}

export async function unsaveListing(
  getToken: () => Promise<string | null>,
  listingId: string,
): Promise<void> {
  await apiFetch<void>(`/me/saved-listings/${listingId}`, getToken, {
    method: 'DELETE',
  });
}
