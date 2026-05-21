/**
 * Purpose: Dispute API functions (file dispute, fetch dispute by id).
 * Why important: Lets the web tenant submit disputes and read their lifecycle
 *   status (OPEN -> INVESTIGATING -> RESOLVED -> CLOSED) from the backend.
 * Used by: dispute submission form, unlock detail page (when surfacing
 *   resolution outcome).
 */
import type {
  CreateDisputeRequest,
  CreateDisputeResponse,
  DisputeRecord,
} from '@pataspace/contracts';
import { clientFetch, serverFetch } from './client';

export async function createDispute(
  getToken: () => Promise<string | null>,
  payload: CreateDisputeRequest,
): Promise<CreateDisputeResponse> {
  return clientFetch<CreateDisputeResponse>('/disputes', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchDispute(
  getToken: () => Promise<string | null>,
  disputeId: string,
): Promise<DisputeRecord> {
  return clientFetch<DisputeRecord>(`/disputes/${disputeId}`, getToken);
}

export async function getDispute(
  token: string | null,
  disputeId: string,
): Promise<DisputeRecord> {
  return serverFetch<DisputeRecord>(`/disputes/${disputeId}`, token);
}
