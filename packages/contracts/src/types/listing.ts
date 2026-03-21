import { ListingStatus } from '../enums';

export type ListingPhoto = {
  url: string;
  s3Key: string;
  order: number;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
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
  propertyType: string;
  furnished?: boolean;
  description: string;
  amenities: string[];
  propertyNotes?: string;
  availableFrom: string;
  availableTo?: string;
  videoUrl?: string;
  photos: ListingPhoto[];
};

export type ListingCard = {
  id: string;
  county: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  unlockCostCredits: number;
  thumbnailUrl?: string;
  status: ListingStatus;
};

export type ListingDetails = ListingCard & {
  description: string;
  amenities: string[];
  propertyType: string;
  furnished: boolean;
  availableFrom: string;
  availableTo?: string;
  latitude?: number;
  longitude?: number;
  photos?: ListingPhoto[];
};

export type ListingFilters = {
  page?: number;
  limit?: number;
  county?: string;
  neighborhood?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
};
