import { ListingStatus } from '../enums';

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
  availableFrom: string;
  availableTo?: string;
  latitude?: number;
  longitude?: number;
};
