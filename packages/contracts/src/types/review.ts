/**
 * Purpose: Unlock-review contract types shared between API, mobile, and web.
 * Why important: Anchors the tenant rating loop after a confirmed unlock so
 *   surfaces stay consistent across clients.
 * Used by: apps/api review module, mobile MobileAppProvider review flow.
 */
import type { ReviewerSide } from '../enums';

export type CreateReviewRequest = {
  unlockId: string;
  rating: number;
  comment?: string;
};

export type ReviewRecord = {
  id: string;
  unlockId: string;
  side: ReviewerSide;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type CreateReviewResponse = ReviewRecord;
