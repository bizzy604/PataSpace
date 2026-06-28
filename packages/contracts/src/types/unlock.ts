export type UnlockContactInfo = {
  phoneNumber: string | null;
  address: string;
  latitude?: number;
  longitude?: number;
};

export type CreateUnlockRequest = {
  listingId: string;
};

export type UnlockTenantContact = {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
};

export type CreateUnlockResponse = {
  unlockId: string;
  creditsSpent: number;
  newBalance: number;
  contactInfo: UnlockContactInfo;
  tenant: UnlockTenantContact;
  message: string;
};

import type { DisputeStatus } from '../enums';

export type UnlockHistoryStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'disputed'
  | 'refunded';

export type MyUnlockDisputeSummary = {
  id: string;
  status: DisputeStatus;
};

export type MyUnlocksFilters = {
  page?: number;
  limit?: number;
  status?: UnlockHistoryStatus;
};

export type MyUnlockListingPreview = {
  id: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms: number;
};

export type MyUnlockRecord = {
  unlockId: string;
  listing: MyUnlockListingPreview;
  creditsSpent: number;
  contactInfo: UnlockContactInfo;
  status: UnlockHistoryStatus;
  myConfirmation: string | null;
  tenantConfirmation: string | null;
  createdAt: string;
  dispute: MyUnlockDisputeSummary | null;
};

export type UnlockPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedMyUnlocksResponse = {
  data: MyUnlockRecord[];
  pagination: UnlockPagination;
};

import type { CommissionStatus } from '../enums';

export type ReceivedUnlockStatus = 'awaiting_confirmation' | 'confirmed' | 'all';

export type ReceivedUnlocksFilters = {
  page?: number;
  limit?: number;
  status?: ReceivedUnlockStatus;
};

export type ReceivedUnlockCommissionSummary = {
  amountKES: number;
  status: CommissionStatus;
  payableOn: string | null;
};

export type ReceivedUnlockRecord = {
  unlockId: string;
  listing: MyUnlockListingPreview;
  incomingConfirmed: boolean;
  outgoingConfirmed: boolean;
  status: UnlockHistoryStatus;
  commission: ReceivedUnlockCommissionSummary | null;
  isRefunded: boolean;
  createdAt: string;
};

export type PaginatedReceivedUnlocksResponse = {
  data: ReceivedUnlockRecord[];
  pagination: UnlockPagination;
};
