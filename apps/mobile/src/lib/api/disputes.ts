/**
 * Purpose: Dispute API functions for the mobile app.
 * Why important: Lets the tenant file disputes against a specific unlock so the
 *   backend can run the OPEN -> INVESTIGATING -> RESOLVED -> CLOSED lifecycle
 *   instead of leaving the action as a local-only notification.
 * Used by: MobileAppProvider (submitDisputeForUnlock).
 */
import type {
  CreateDisputeRequest,
  CreateDisputeResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function createDispute(
  getToken: () => Promise<string | null>,
  payload: CreateDisputeRequest,
): Promise<CreateDisputeResponse> {
  return apiFetch<CreateDisputeResponse>('/disputes', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
