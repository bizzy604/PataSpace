/**
 * Purpose: Review API client for the web app.
 * Why important: Lets the unlock-detail review form submit to POST /reviews.
 * Used by: web review form (client).
 */
import type {
  CreateReviewRequest,
  CreateReviewResponse,
} from '@pataspace/contracts';
import { clientFetch } from './client';

export async function createReview(
  getToken: () => Promise<string | null>,
  payload: CreateReviewRequest,
): Promise<CreateReviewResponse> {
  return clientFetch<CreateReviewResponse>('/reviews', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
