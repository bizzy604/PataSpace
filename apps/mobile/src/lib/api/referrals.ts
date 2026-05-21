/**
 * Purpose: Referral API client for the mobile app.
 * Why important: Routes invite-friends calls to /referrals so invitations land
 *   in the backend lifecycle (INVITED → JOINED → REWARDED).
 * Used by: MobileAppProvider (sendReferralInvite).
 */
import type {
  CreateReferralRequest,
  CreateReferralResponse,
  PaginatedReferralsResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function createReferral(
  getToken: () => Promise<string | null>,
  payload: CreateReferralRequest,
): Promise<CreateReferralResponse> {
  return apiFetch<CreateReferralResponse>('/referrals', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMyReferrals(
  getToken: () => Promise<string | null>,
  page = 1,
  limit = 20,
): Promise<PaginatedReferralsResponse> {
  return apiFetch<PaginatedReferralsResponse>(
    `/referrals/me?page=${page}&limit=${limit}`,
    getToken,
  );
}
