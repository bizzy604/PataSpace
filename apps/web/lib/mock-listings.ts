export type MockListing = {
  id: string;
  title: string;
  county: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  unlockCostCredits: number;
  availableFrom: string;
  description: string;
  amenities: string[];
  verification: string[];
  tenant: {
    firstName: string;
    joinedDate: string;
    listingsPosted: number;
  };
};

export const mockListings: MockListing[] = [
  {
    id: 'listing-1',
    title: 'Sunny 2BR handover near Yaya Centre',
    county: 'Nairobi',
    neighborhood: 'Kilimani',
    monthlyRent: 25000,
    bedrooms: 2,
    bathrooms: 1,
    unlockCostCredits: 2500,
    availableFrom: '2026-05-01',
    description:
      'Spacious unit with balcony, steady water, responsive caretaker, and quick access to Ngong Road.',
    amenities: ['Water 24/7', 'Backup generator', 'Parking', 'Balcony'],
    verification: ['10 photos captured on mobile', 'Video walkthrough uploaded', 'GPS matched'],
    tenant: {
      firstName: 'John',
      joinedDate: '2026-01-15',
      listingsPosted: 2,
    },
  },
  {
    id: 'listing-2',
    title: 'Affordable studio close to CBD routes',
    county: 'Nairobi',
    neighborhood: 'South B',
    monthlyRent: 14500,
    bedrooms: 0,
    bathrooms: 1,
    unlockCostCredits: 1450,
    availableFrom: '2026-04-12',
    description:
      'Compact studio with reliable matatu access, secure gate, and quick move-in timing for a solo tenant.',
    amenities: ['Secure gate', 'Water tank', 'Near matatu stage'],
    verification: ['8 photos captured on mobile', 'Caretaker note included', 'GPS matched'],
    tenant: {
      firstName: 'Mercy',
      joinedDate: '2025-11-02',
      listingsPosted: 1,
    },
  },
  {
    id: 'listing-3',
    title: 'Furnished one-bedroom in Westlands',
    county: 'Nairobi',
    neighborhood: 'Westlands',
    monthlyRent: 42000,
    bedrooms: 1,
    bathrooms: 1,
    unlockCostCredits: 4200,
    availableFrom: '2026-06-01',
    description:
      'Furnished one-bedroom in a quieter corner of Westlands with dependable Wi-Fi options and backup power.',
    amenities: ['Furnished', 'Backup power', 'Elevator', 'Fiber available'],
    verification: ['12 photos captured on mobile', 'Video walkthrough uploaded', 'GPS matched'],
    tenant: {
      firstName: 'Brian',
      joinedDate: '2025-08-20',
      listingsPosted: 3,
    },
  },
];

export function getMockListingById(id: string) {
  return mockListings.find((listing) => listing.id === id);
}
