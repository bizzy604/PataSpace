/**
 * Purpose: Review API client for the mobile app.
 * Why important: Lets a participant in a confirmed unlock submit a rating to
 *   /reviews so feedback persists in the backend instead of staying local.
 * Used by: MobileAppProvider (submitReviewForUnlock).
 */
import type {
  CreateReviewRequest,
  CreateReviewResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function createReview(
  getToken: () => Promise<string | null>,
  payload: CreateReviewRequest,
): Promise<CreateReviewResponse> {
  return apiFetch<CreateReviewResponse>('/reviews', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
