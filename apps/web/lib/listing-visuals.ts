export type ListingVisual = {
  hero: string;
  gallery: string[];
  alt: string;
  mapLabel: string;
  neighborhoodTag: string;
};

const fallbackVisual: ListingVisual = {
  hero: '/mock/houses/photo1.jpg',
  gallery: [
    '/mock/houses/photo1.jpg',
    '/mock/houses/photo2.jpg',
    '/mock/houses/photo3.jpg',
    '/mock/houses/photo4.jpg',
  ],
  alt: 'Modern house exterior used as a mock listing image.',
  mapLabel: 'Approximate area map unlocks after payment',
  neighborhoodTag: 'Verified area',
};

const listingVisualsById: Record<string, ListingVisual> = {
  'listing-1': {
    hero: '/mock/houses/photo1.jpg',
    gallery: [
      '/mock/houses/photo1.jpg',
      '/mock/houses/photo2.jpg',
      '/mock/houses/photo6.jpg',
      '/mock/houses/photo4.jpg',
    ],
    alt: 'Bright white home with a pool and balcony.',
    mapLabel: 'Kilimani coverage, exact address hidden until unlock',
    neighborhoodTag: 'Kilimani',
  },
  'listing-2': {
    hero: '/mock/houses/photo3.jpg',
    gallery: [
      '/mock/houses/photo3.jpg',
      '/mock/houses/photo4.jpg',
      '/mock/houses/photo2.jpg',
      '/mock/houses/photo6.jpg',
    ],
    alt: 'Modern two-storey home with a wide pool and front shrubs.',
    mapLabel: 'South B area preview, exact address hidden until unlock',
    neighborhoodTag: 'South B',
  },
  'listing-3': {
    hero: '/mock/houses/photo5.jpg',
    gallery: [
      '/mock/houses/photo5.jpg',
      '/mock/houses/photo2.jpg',
      '/mock/houses/photo1.jpg',
      '/mock/houses/photo6.jpg',
    ],
    alt: 'Glass-front modern home lit at dusk.',
    mapLabel: 'Westlands area preview, exact address hidden until unlock',
    neighborhoodTag: 'Westlands',
  },
};

export function getListingVisual(id: string): ListingVisual {
  return listingVisualsById[id] ?? fallbackVisual;
}

export const neighborhoodSearchCards = [
  {
    name: 'Kilimani',
    image: '/mock/houses/photo1.jpg',
    description: 'Fast-moving 1BR and 2BR inventory.',
  },
  {
    name: 'Westlands',
    image: '/mock/houses/photo5.jpg',
    description: 'Premium apartments and furnished lofts.',
  },
  {
    name: 'Lavington',
    image: '/mock/houses/photo6.jpg',
    description: 'Quiet compounds with longer-stay tenants.',
  },
  {
    name: 'South B',
    image: '/mock/houses/photo3.jpg',
    description: 'Budget options with strong commuter access.',
  },
];
