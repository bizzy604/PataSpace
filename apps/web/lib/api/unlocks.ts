/**
 * Purpose: Unlock API functions (create unlock, fetch history, fetch detail).
 * Why important: Centralises unlock HTTP calls for the unlock detail and history pages.
 * Used by: UnlockDetailPage, unlock history page, listing detail unlock button.
 */
import type {
  CreateUnlockRequest,
  CreateUnlockResponse,
  MyUnlocksFilters,
  PaginatedMyUnlocksResponse,
} from '@pataspace/contracts';
import { clientFetch } from './client';

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
): Promise<{ message: string }> {
  return clientFetch<{ message: string }>(`/confirmations`, getToken, {
    method: 'POST',
    body: JSON.stringify({ unlockId, side: 'BUYER' }),
  });
}
