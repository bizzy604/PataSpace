/**
 * Purpose: Referral API client for the web app.
 * Why important: Routes invite/list calls to /referrals so the workspace can
 *   render the tenant's invite history and let them send new ones.
 * Used by: /referrals server page + referral invite form (client).
 */
import type {
  CreateReferralRequest,
  CreateReferralResponse,
  PaginatedReferralsResponse,
} from '@pataspace/contracts';
import { clientFetch, serverFetch } from './client';

export async function getMyReferrals(
  token: string | null,
  page = 1,
  limit = 50,
): Promise<PaginatedReferralsResponse> {
  return serverFetch<PaginatedReferralsResponse>(
    `/referrals/me?page=${page}&limit=${limit}`,
    token,
  );
}

export async function createReferral(
  getToken: () => Promise<string | null>,
  payload: CreateReferralRequest,
): Promise<CreateReferralResponse> {
  return clientFetch<CreateReferralResponse>('/referrals', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
