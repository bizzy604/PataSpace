import { ListingStatus } from '../enums';

export type RejectListingRequest = {
  reason: string;
};

export type AdminListingTenant = {
  id: string;
  firstName: string;
  phoneNumber: string;
  listingsPosted: number;
};

export type AdminPendingListing = {
  id: string;
  tenant: AdminListingTenant;
  county: string;
  neighborhood: string;
  monthlyRent: number;
  photos: Array<{
    url: string;
    order: number;
    width?: number;
    height?: number;
  }>;
  createdAt: string;
  daysWaiting: number;
};

export type AdminPendingListingsResponse = {
  data: AdminPendingListing[];
};

export type ModerateListingResponse = {
  id: string;
  status: ListingStatus;
  message: string;
};
