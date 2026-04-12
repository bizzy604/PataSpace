import { ListingHouseType, ListingStatus } from '../enums';

export type ListingPhotoInput = {
  url: string;
  s3Key: string;
  order: number;
  width?: number;
  height?: number;
  latitude: number;
  longitude: number;
  takenAt?: string;
};

export type ListingVideoInput = {
  url: string;
  s3Key: string;
};

export type CreateListingRequest = {
  county: string;
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  houseType: ListingHouseType;
  propertyType: string;
  furnished?: boolean;
  description: string;
  amenities: string[];
  propertyNotes?: string;
  availableFrom: string;
  availableTo?: string;
  photos: ListingPhotoInput[];
  video: ListingVideoInput;
};

export type UpdateListingRequest = Partial<CreateListingRequest>;

export type ListingPhoto = {
  url: string;
  order: number;
  width?: number;
  height?: number;
};

export type ListingVideo = {
  url: string;
};

export type ListingTenantPreview = {
  firstName: string;
  joinedDate: string;
};

export type ListingTenantDetails = ListingTenantPreview & {
  listingsPosted: number;
};

export type ListingContactInfo = {
  address: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
};

export type ListingMapLocation = {
  approxLatitude: number;
  approxLongitude: number;
};

export type ListingCard = {
  id: string;
  county: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  houseType: ListingHouseType;
  propertyType: string;
  furnished: boolean;
  availableFrom: string;
  unlockCostCredits: number;
  thumbnailUrl?: string;
  viewCount: number;
  unlockCount: number;
  isUnlocked: boolean;
  createdAt: string;
  mapLocation: ListingMapLocation;
  tenant: ListingTenantPreview;
};

export type ListingDetails = ListingCard & {
  description: string;
  amenities: string[];
  propertyNotes?: string;
  availableTo?: string;
  photos: ListingPhoto[];
  video?: ListingVideo;
  tenant: ListingTenantDetails;
  contactInfo?: ListingContactInfo;
};

export type ListingFilters = {
  page?: number;
  limit?: number;
  county?: string;
  neighborhood?: string;
  neighborhoods?: string[];
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  availableFrom?: string;
  availableTo?: string;
  furnished?: boolean;
  sortBy?: 'createdAt' | 'monthlyRent';
  sortOrder?: 'asc' | 'desc';
};

export type CreateListingResponse = {
  id: string;
  status: ListingStatus;
  message: string;
  unlockCostCredits: number;
  commission: number;
  estimatedApprovalTime?: string;
};

export type UpdateListingResponse = {
  id: string;
  message: string;
  updatedAt: string;
};

export type MyListingsFilters = {
  page?: number;
  limit?: number;
  status?: ListingStatus;
};

export type MyListing = {
  id: string;
  status: ListingStatus;
  monthlyRent: number;
  neighborhood: string;
  viewCount: number;
  unlockCount: number;
  totalEarnings: number;
  pendingEarnings: number;
  createdAt: string;
};

export type ListingPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedListingsResponse = {
  data: ListingCard[];
  pagination: ListingPagination;
};

export type PaginatedMyListingsResponse = {
  data: MyListing[];
  pagination: ListingPagination;
};
