import { ListingStatus } from '../enums';

export type ModerateListingRequest = {
  listingId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
};

export type AdminListingReview = {
  id: string;
  userId: string;
  county: string;
  neighborhood: string;
  monthlyRent: number;
  status: ListingStatus;
  createdAt: string;
};
