/**
 * Purpose: Unlock API functions for the mobile app.
 * Why important: Creates unlocks, fetches unlock history, submits confirmations,
 *   reports dead listings for instant refunds, and settles success fees.
 * Used by: use-mobile-api-sync hook, MobileAppProvider (unlockListing, confirmIncoming,
 *   confirmReceivedUnlock, settleFee, reportDeadUnlock, received-unlocks sync).
 */
import type {
  ConfirmationSide,
  CreateConfirmationResponse,
  CreateUnlockRequest,
  CreateUnlockResponse,
  PaginatedMyUnlocksResponse,
  PaginatedReceivedUnlocksResponse,
  ReceivedUnlockRecord,
  ReportUnlockDeadRequest,
  ReportUnlockDeadResponse,
  SettleSuccessFeeResponse,
  UnlockDeadReason,
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

export async function reportUnlockDead(
  getToken: () => Promise<string | null>,
  unlockId: string,
  reason: UnlockDeadReason,
  comment?: string,
): Promise<ReportUnlockDeadResponse> {
  return apiFetch<ReportUnlockDeadResponse>(`/unlocks/${unlockId}/report-dead`, getToken, {
    method: 'POST',
    body: JSON.stringify({ reason, comment } satisfies ReportUnlockDeadRequest),
  });
}

export async function settleSuccessFee(
  getToken: () => Promise<string | null>,
  unlockId: string,
): Promise<SettleSuccessFeeResponse> {
  return apiFetch<SettleSuccessFeeResponse>('/confirmations/settle-fee', getToken, {
    method: 'POST',
    body: JSON.stringify({ unlockId }),
  });
}

export async function fetchReceivedUnlocks(
  getToken: () => Promise<string | null>,
  page = 1,
  limit = 50,
): Promise<PaginatedReceivedUnlocksResponse> {
  return apiFetch<PaginatedReceivedUnlocksResponse>(
    `/unlocks/received?page=${page}&limit=${limit}`,
    getToken,
  );
}

/**
 * Fetches every received-unlock page so the owner's full list is preserved
 * (the API caps limit at 50). Used by the provider refresh and sign-in sync.
 */
export async function fetchAllReceivedUnlocks(
  getToken: () => Promise<string | null>,
): Promise<ReceivedUnlockRecord[]> {
  const limit = 50;
  const all: ReceivedUnlockRecord[] = [];
  let page = 1;

  for (;;) {
    const response = await fetchReceivedUnlocks(getToken, page, limit);
    all.push(...response.data);
    if (!response.pagination.hasNext) {
      break;
    }
    page += 1;
  }

  return all;
}
