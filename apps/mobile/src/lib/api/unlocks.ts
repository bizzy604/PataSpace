/**
 * Purpose: Unlock API functions for the mobile app.
 * Why important: Creates unlocks, fetches unlock history, and submits confirmations.
 * Used by: use-mobile-api-sync hook, MobileAppProvider (unlockListing, confirmIncoming, confirmOutgoing).
 */
import type {
  ConfirmationSide,
  CreateConfirmationResponse,
  CreateUnlockRequest,
  CreateUnlockResponse,
  PaginatedMyUnlocksResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function createUnlock(
  getToken: () => Promise<string | null>,
  listingId: string,
): Promise<CreateUnlockResponse> {
  return apiFetch<CreateUnlockResponse>('/unlocks', getToken, {
    method: 'POST',
    body: JSON.stringify({ listingId } satisfies CreateUnlockRequest),
  });
}

export async function fetchMyUnlocks(
  getToken: () => Promise<string | null>,
  page = 1,
  limit = 50,
): Promise<PaginatedMyUnlocksResponse> {
  return apiFetch<PaginatedMyUnlocksResponse>(
    `/unlocks/my-unlocks?page=${page}&limit=${limit}`,
    getToken,
  );
}

export async function confirmUnlock(
  getToken: () => Promise<string | null>,
  unlockId: string,
  side: ConfirmationSide,
): Promise<CreateConfirmationResponse> {
  return apiFetch<CreateConfirmationResponse>('/confirmations', getToken, {
    method: 'POST',
    body: JSON.stringify({ unlockId, side }),
  });
}
