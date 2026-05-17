/**
 * Purpose: Unlock API functions (create unlock, fetch history, fetch detail).
 * Why important: Centralises unlock HTTP calls for the unlock detail and history pages.
 * Used by: UnlockDetailPage, unlock history page, listing detail unlock button.
 */
import type {
  CreateConfirmationResponse,
  CreateUnlockRequest,
  CreateUnlockResponse,
  MyUnlocksFilters,
  PaginatedMyUnlocksResponse,
} from '@pataspace/contracts';
import { ConfirmationSide } from '@pataspace/contracts';
import { clientFetch, serverFetch } from './client';

export async function createUnlock(
  getToken: () => Promise<string | null>,
  listingId: string,
): Promise<CreateUnlockResponse> {
  const body: CreateUnlockRequest = { listingId };
  return clientFetch<CreateUnlockResponse>('/unlocks', getToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchMyUnlocks(
  getToken: () => Promise<string | null>,
  filters?: MyUnlocksFilters,
): Promise<PaginatedMyUnlocksResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.status) params.set('status', filters.status);
  return clientFetch<PaginatedMyUnlocksResponse>(
    `/unlocks/my-unlocks?${params.toString()}`,
    getToken,
  );
}

export async function confirmUnlock(
  getToken: () => Promise<string | null>,
  unlockId: string,
): Promise<CreateConfirmationResponse> {
  return clientFetch<CreateConfirmationResponse>(`/confirmations`, getToken, {
    method: 'POST',
    body: JSON.stringify({ unlockId, side: ConfirmationSide.INCOMING_TENANT }),
  });
}

/** Server component — fetch unlock history for the authenticated user. */
export async function getMyUnlocks(
  token: string | null,
  page = 1,
  limit = 50,
): Promise<PaginatedMyUnlocksResponse> {
  return serverFetch<PaginatedMyUnlocksResponse>(
    `/unlocks/my-unlocks?page=${page}&limit=${limit}`,
    token,
  );
}
