export type ListingPreview = {
  id: string;
  title: string;
  price: string;
  unlockCost: string;
  area: string;
  location: string;
  meta: string;
  blurb: string;
  status: string;
  photoCount: string;
  imageHint: string;
  availableFrom: string;
  tags: string[];
  amenities: string[];
  quote: string;
  quoteAuthor: string;
  stats: {
    views: string;
    unlocks: string;
    freshness: string;
  };
};

export const listingFilters = ['For you', 'Verified', 'Budget', '2 BR'];

export const featuredListings: ListingPreview[] = [
  {
    id: 'kilimani-sunny-2br',
    title: 'Sunny 2BR handover near Yaya Centre',
    price: 'KES 25,000/mo',
    unlockCost: '2,500 credits',
    area: 'Kilimani',
    location: 'Argwings Kodhek Rd, Nairobi',
    meta: '2 bed  |  1 bath  |  Apartment  |  3 unlocks',
    blurb: 'Bright corner unit with balcony light, honest tenant photos, and an easy matatu connection into town.',
    status: 'Verified',
    photoCount: '12 photos',
    imageHint: 'Tenant-shot gallery with room-by-room coverage.',
    availableFrom: 'Available from April 1, 2026',
    tags: ['Balcony', 'Water 24/7', 'Parking'],
    amenities: ['Water 24/7', 'Parking', 'Caretaker on site', 'Prepaid power'],
    quote: 'The landlord fixes things quickly and the block stays quiet even on weekends.',
    quoteAuthor: 'Current tenant, moving out next month',
    stats: {
      views: '45',
      unlocks: '3',
      freshness: '2 days ago',
    },
  },
  {
    id: 'south-b-studio',
    title: 'Budget studio close to CBD routes',
    price: 'KES 14,500/mo',
    unlockCost: '1,450 credits',
    area: 'South B',
    location: 'Likoni Rd, Nairobi',
    meta: 'Studio  |  1 bath  |  Bedsitter  |  2 unlocks',
    blurb: 'Compact setup for someone commuting daily, with recent kitchen upgrades and strong daylight.',
    status: 'Hot',
    photoCount: '8 photos',
    imageHint: 'Kitchen and bathroom updates already uploaded.',
    availableFrom: 'Available from March 30, 2026',
    tags: ['Near CBD', 'Budget', 'Fast move'],
    amenities: ['Water storage', 'Secure gate', 'Laundry line', 'Good bus access'],
    quote: 'If you leave before 7:30 AM, the commute into town is straightforward.',
    quoteAuthor: 'Current tenant, shifting for work',
    stats: {
      views: '29',
      unlocks: '2',
      freshness: 'Today',
    },
  },
  {
    id: 'westlands-loft',
    title: 'Modern loft with rooftop access',
    price: 'KES 38,000/mo',
    unlockCost: '3,800 credits',
    area: 'Westlands',
    location: 'Muthithi Rd, Nairobi',
    meta: '1 bed  |  1 bath  |  Loft  |  5 unlocks',
    blurb: 'Premium finish, strong natural light, and a flexible move-in window for someone upgrading fast.',
    status: 'New',
    photoCount: '15 photos',
    imageHint: 'Wide room angles plus rooftop and storage shots.',
    availableFrom: 'Available from April 8, 2026',
    tags: ['Rooftop', 'Premium', 'Generator'],
    amenities: ['Generator backup', 'Lift access', 'Gym nearby', 'Dedicated parking'],
    quote: 'The building management is responsive and the rooftop is rarely crowded.',
    quoteAuthor: 'Current tenant, relocating overseas',
    stats: {
      views: '62',
      unlocks: '5',
      freshness: '1 day ago',
    },
  },
];

export function getListingById(id?: string | string[]) {
  const listingId = Array.isArray(id) ? id[0] : id;

  return featuredListings.find((listing) => listing.id === listingId) ?? featuredListings[0];
}

export const createListingSteps = [
  {
    step: '01',
    title: 'Capture every room once',
    detail: 'Use the guided shot list so renters see the house before asking for a visit.',
  },
  {
    step: '02',
    title: 'Attach GPS and area details',
    detail: 'Location proof keeps the listing trusted and protects the unlock flow later.',
  },
  {
    step: '03',
    title: 'Publish with move-out context',
    detail: 'Add rent, deposit, and handover notes so the right tenant self-selects.',
  },
];

export const myListingRows = [
  {
    id: 'kilimani-sunny-2br',
    title: 'Sunny 2BR handover near Yaya Centre',
    status: 'Live',
    views: '127',
    unlocks: '3',
    payout: 'KES 750 pending',
    updated: 'Updated 2h ago',
  },
  {
    id: 'south-b-studio',
    title: 'Budget studio close to CBD routes',
    status: 'Review',
    views: '18',
    unlocks: '0',
    payout: 'Waiting for publish',
    updated: 'Awaiting media check',
  },
];

export const confirmationStages = [
  {
    step: '01',
    title: 'Incoming tenant confirms interest',
    detail: 'They acknowledge the contact worked and the place still matches the listing.',
  },
  {
    step: '02',
    title: 'Outgoing tenant confirms the handoff',
    detail: 'This closes the loop on the unlock and prevents payout disputes later.',
  },
  {
    step: '03',
    title: 'Commission enters hold then payout',
    detail: 'The platform waits out the hold period before releasing commission downstream.',
  },
];
