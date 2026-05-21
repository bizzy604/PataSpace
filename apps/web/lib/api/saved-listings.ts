/**
 * Purpose: Saved-listings API client for the web app.
 * Why important: Routes save/unsave/list calls to /me/saved-listings so the
 *   tenant's Saved tab is backed by the database.
 * Used by: /saved server page, client save/unsave buttons.
 */
import type {
  PaginatedSavedListingsResponse,
  SaveListingRequest,
  SaveListingResponse,
} from '@pataspace/contracts';
import { clientFetch, serverFetch } from './client';

export async function getMySavedListings(
  token: string | null,
  page = 1,
  limit = 50,
): Promise<PaginatedSavedListingsResponse> {
  return serverFetch<PaginatedSavedListingsResponse>(
    `/me/saved-listings?page=${page}&limit=${limit}`,
    token,
  );
}

export async function saveListing(
  getToken: () => Promise<string | null>,
  listingId: string,
): Promise<SaveListingResponse> {
  return clientFetch<SaveListingResponse>('/me/saved-listings', getToken, {
    method: 'POST',
    body: JSON.stringify({ listingId } satisfies SaveListingRequest),
  });
}

export async function unsaveListing(
  getToken: () => Promise<string | null>,
  listingId: string,
): Promise<void> {
  await clientFetch<void>(`/me/saved-listings/${listingId}`, getToken, {
    method: 'DELETE',
  });
}
