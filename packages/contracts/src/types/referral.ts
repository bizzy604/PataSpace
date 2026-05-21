/**
 * Purpose: Referral contract types shared between API, mobile, and web.
 * Why important: Anchors the invite-by-phone loop and downstream reward
 *   accounting (INVITED → JOINED → REWARDED → EXPIRED).
 * Used by: apps/api referral module, mobile MobileAppProvider referral flow.
 */
import type { ReferralStatus } from '../enums';

export type CreateReferralRequest = {
  phoneNumber: string;
};

export type ReferralRecord = {
  id: string;
  code: string;
  inviteePhoneMasked: string;
  status: ReferralStatus;
  joinedAt: string | null;
  rewardedAt: string | null;
  createdAt: string;
};

export type CreateReferralResponse = ReferralRecord;

export type PaginatedReferralsResponse = {
  data: ReferralRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
