import type { ImageSourcePropType } from 'react-native';
import type {
  ListingMapLocation,
  UnlockContactInfo,
} from '@pataspace/contracts';
import { draftCameraSequence, listingGallerySets, type LocalMedia } from '@/data/media-library';

export type ListingStatus = 'Verified' | 'Hot' | 'New' | 'Live' | 'Review' | 'Closed';

export type ListingMedia = LocalMedia;

const APPROXIMATE_MAP_COORDINATE_DECIMALS = 2;

const fallbackMapLocationByArea: Record<string, ListingMapLocation> = {
  Kilimani: {
    approxLatitude: -1.29,
    approxLongitude: 36.79,
  },
  'South B': {
    approxLatitude: -1.32,
    approxLongitude: 36.83,
  },
  Westlands: {
    approxLatitude: -1.27,
    approxLongitude: 36.8,
  },
  'Ngong Road': {
    approxLatitude: -1.3,
    approxLongitude: 36.78,
  },
};

function roundCoordinate(value: number) {
  const precision = 10 ** APPROXIMATE_MAP_COORDINATE_DECIMALS;

  return Math.round(value * precision) / precision;
}

export function toApproximateMapLocation(
  latitude: number,
  longitude: number,
): ListingMapLocation {
  return {
    approxLatitude: roundCoordinate(latitude),
    approxLongitude: roundCoordinate(longitude),
  };
}

export function resolveApproximateMapLocation(
  area: string,
  gps?: { latitude: number; longitude: number },
): ListingMapLocation {
  if (gps) {
    return toApproximateMapLocation(gps.latitude, gps.longitude);
  }

  return fallbackMapLocationByArea[area] ?? fallbackMapLocationByArea.Kilimani;
}

export function buildUnlockContactInfo(
  address: string,
  phoneNumber: string,
  latitude?: number,
  longitude?: number,
): UnlockContactInfo {
  const contactInfo: UnlockContactInfo = {
    address,
    phoneNumber,
  };

  if (latitude !== undefined) {
    contactInfo.latitude = latitude;
  }

  if (longitude !== undefined) {
    contactInfo.longitude = longitude;
  }

  return contactInfo;
}

export type ListingPreview = {
  id: string;
  title: string;
  price: string;
  monthlyRent: number;
  unlockCost: string;
  unlockCostCredits: number;
  commissionAmount: string;
  area: string;
  location: string;
  directions: string;
  meta: string;
  blurb: string;
  status: ListingStatus;
  coverImage: ImageSourcePropType;
  photoCount: string;
  imageHint: string;
  availableFrom: string;
  deposit: string;
  moveReason: string;
  tags: string[];
  amenities: string[];
  galleryMedia: ListingMedia[];
  mapLocation: ListingMapLocation;
  quote: string;
  quoteAuthor: string;
  stats: {
    views: string;
    unlocks: string;
    saves: string;
    freshness: string;
  };
};

export type MyListingRow = {
  id: string;
  title: string;
  status: 'Live' | 'Review' | 'Closed';
  views: string;
  unlocks: string;
  payout: string;
  updated: string;
  reviewNote: string;
};

export type WalletPackage = {
  id: string;
  label: string;
  credits: number;
  price: string;
  bonus: string;
  description: string;
};

export type TransactionRecord = {
  id: string;
  type: 'topup' | 'unlock' | 'referral' | 'support';
  title: string;
  status: 'Completed' | 'Pending';
  amount: string;
  credits: string;
  date: string;
  detail: string;
};

export type UnlockRecord = {
  id: string;
  listingId: string;
  creditsSpent: number;
  contactInfo: UnlockContactInfo;
  incomingConfirmed: boolean;
  outgoingConfirmed: boolean;
  createdAt: string;
  holdUntil: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  detail: string;
  time: string;
  target:
    | { route: 'listing'; id: string }
    | { route: 'credits' }
    | { route: 'confirmations' }
    | { route: 'my-listings' }
    | { route: 'profile' };
};

export type ListingDraftPhoto = {
  id: string;
  label: string;
  quality: 'Strong' | 'Retake';
  source: ImageSourcePropType;
  capturedAt?: string;
  locationLabel?: string;
  gps?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    mocked?: boolean;
    timestamp?: number;
  };
};

export type ListingDraft = {
  title: string;
  area: string;
  location: string;
  monthlyRent: string;
  deposit: string;
  availableFrom: string;
  description: string;
  amenities: string;
  landlordPhone: string;
  moveReason: string;
  photos: ListingDraftPhoto[];
};

export type SearchFilters = {
  verifiedOnly: boolean;
  fastMove: boolean;
  selectedBudget: 'Any' | 'Budget' | 'Mid' | 'Premium';
  selectedSize: 'Any' | 'Studio' | '1 BR' | '2 BR';
  selectedArea: string | null;
};

export type UserProfile = {
  name: string;
  initials: string;
  phone: string;
  preferredArea: string;
  bio: string;
};

export type AppSettings = {
  pushNotifications: boolean;
  smsAlerts: boolean;
  savedSearchAlerts: boolean;
};

function formatCurrency(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

export function formatCredits(amount: number) {
  return `${amount.toLocaleString()} credits`;
}

function buildListing(
  listing: Omit<
    ListingPreview,
    'price' | 'unlockCost' | 'unlockCostCredits' | 'commissionAmount' | 'photoCount'
  >,
) {
  const unlockCostCredits = Math.round(listing.monthlyRent * 0.1);

  return {
    ...listing,
    unlockCostCredits,
    price: `${formatCurrency(listing.monthlyRent)}/mo`,
    unlockCost: formatCredits(unlockCostCredits),
    commissionAmount: formatCurrency(Math.round(unlockCostCredits * 0.3)),
    photoCount: `${listing.galleryMedia.length} photos`,
  };
}

export const listingFilters = ['For you', 'Verified', 'Budget', '2 BR'];

export const neighborhoodSuggestions = ['Kilimani', 'South B', 'Westlands', 'Ngong Road'];

export const filterBudgetOptions: SearchFilters['selectedBudget'][] = ['Any', 'Budget', 'Mid', 'Premium'];

export const filterSizeOptions: SearchFilters['selectedSize'][] = ['Any', 'Studio', '1 BR', '2 BR'];

export const onboardingSlides = [
  {
    id: 'discover',
    title: 'See the real home before you travel',
    description:
      'Tenant-shot media, honest captions, and move-out timing help you judge fit before you spend credits.',
  },
  {
    id: 'unlock',
    title: 'Only pay when the listing feels worth it',
    description:
      'Unlocking reveals direct contact, exact address, directions, and the precise GPS pin.',
  },
  {
    id: 'post',
    title: 'Outgoing tenants can publish in one guided flow',
    description:
      'Capture the rooms, add GPS-backed details, and send the listing into review or live status without leaving mobile.',
  },
];

export const featuredListings: ListingPreview[] = [
  buildListing({
    id: 'kilimani-sunny-2br',
    title: 'Sunny 2BR handover near Yaya Centre',
    monthlyRent: 25000,
    area: 'Kilimani',
    location: 'Argwings Kodhek Rd, Nairobi',
    directions: 'Use the Yaya Centre roundabout gate, then take the second left into Block B.',
    meta: '2 bed  |  1 bath  |  Apartment  |  3 unlocks',
    blurb:
      'Bright corner unit with balcony light, honest tenant photos, and an easy matatu connection into town.',
    status: 'Verified',
    coverImage: listingGallerySets.kilimani[0].source,
    imageHint: 'Tenant-shot gallery with room-by-room coverage.',
    availableFrom: 'Available from April 1, 2026',
    deposit: 'KES 25,000',
    moveReason: 'Current tenant is relocating to Mombasa for work.',
    tags: ['Balcony', 'Water 24/7', 'Parking'],
    amenities: ['Water 24/7', 'Parking', 'Caretaker on site', 'Prepaid power'],
    galleryMedia: [...listingGallerySets.kilimani],
    mapLocation: fallbackMapLocationByArea.Kilimani,
    quote: 'The landlord fixes things quickly and the block stays quiet even on weekends.',
    quoteAuthor: 'Current tenant, moving out next month',
    stats: {
      views: '45',
      unlocks: '3',
      saves: '14',
      freshness: '2 days ago',
    },
  }),
  buildListing({
    id: 'south-b-studio',
    title: 'Budget studio close to CBD routes',
    monthlyRent: 14500,
    area: 'South B',
    location: 'Likoni Rd, Nairobi',
    directions: 'Enter through the east gate and the studio is the second unit on the right.',
    meta: 'Studio  |  1 bath  |  Bedsitter  |  2 unlocks',
    blurb:
      'Compact setup for someone commuting daily, with recent kitchen upgrades and strong daylight.',
    status: 'Hot',
    coverImage: listingGallerySets.southB[0].source,
    imageHint: 'Kitchen and bathroom updates already uploaded.',
    availableFrom: 'Available from March 30, 2026',
    deposit: 'KES 14,500',
    moveReason: 'Tenant is upgrading to a larger place.',
    tags: ['Near CBD', 'Budget', 'Fast move'],
    amenities: ['Water storage', 'Secure gate', 'Laundry line', 'Good bus access'],
    galleryMedia: [...listingGallerySets.southB],
    mapLocation: fallbackMapLocationByArea['South B'],
    quote: 'If you leave before 7:30 AM, the commute into town is straightforward.',
    quoteAuthor: 'Current tenant, shifting for work',
    stats: {
      views: '29',
      unlocks: '2',
      saves: '11',
      freshness: 'Today',
    },
  }),
  buildListing({
    id: 'westlands-loft',
    title: 'Modern loft with rooftop access',
    monthlyRent: 38000,
    area: 'Westlands',
    location: 'Muthithi Rd, Nairobi',
    directions: 'Pass the lobby desk, use lift B, and the rooftop access is one level above the apartment.',
    meta: '1 bed  |  1 bath  |  Loft  |  5 unlocks',
    blurb:
      'Premium finish, strong natural light, and a flexible move-in window for someone upgrading fast.',
    status: 'New',
    coverImage: listingGallerySets.westlands[0].source,
    imageHint: 'Wide room angles plus rooftop and storage shots.',
    availableFrom: 'Available from April 8, 2026',
    deposit: 'KES 76,000',
    moveReason: 'Current tenant is relocating overseas.',
    tags: ['Rooftop', 'Premium', 'Generator'],
    amenities: ['Generator backup', 'Lift access', 'Gym nearby', 'Dedicated parking'],
    galleryMedia: [...listingGallerySets.westlands],
    mapLocation: fallbackMapLocationByArea.Westlands,
    quote: 'The building management is responsive and the rooftop is rarely crowded.',
    quoteAuthor: 'Current tenant, relocating overseas',
    stats: {
      views: '62',
      unlocks: '5',
      saves: '19',
      freshness: '1 day ago',
    },
  }),
];

export const initialUnlockContactInfoByListingId: Record<string, UnlockContactInfo> = {
  'kilimani-sunny-2br': buildUnlockContactInfo(
    'Yaya Court Apartments, Block B, 4th Floor, Kilimani',
    '+254 712 440 128',
    -1.289563,
    36.790942,
  ),
  'south-b-studio': buildUnlockContactInfo(
    'Likoni Flats, South B Estate, Ground Floor',
    '+254 703 281 990',
    -1.3167,
    36.8333,
  ),
  'westlands-loft': buildUnlockContactInfo(
    'Muthithi Heights, 8th Floor, Westlands',
    '+254 722 441 660',
    -1.2675,
    36.8108,
  ),
};

export function getListingById(listings: ListingPreview[], id?: string | string[]) {
  const listingId = Array.isArray(id) ? id[0] : id;

  return listings.find((listing) => listing.id === listingId);
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

export const photoCapturePrompts = [
  'Building entrance',
  'Living room',
  'Kitchen',
  'Primary bedroom',
  'Bathroom',
  'Window or balcony view',
  'Water point',
  'Power meter',
];

export { draftCameraSequence };

export const initialDraft: ListingDraft = {
  title: 'Bright 1BR near Ngong Road',
  area: 'Kilimani',
  location: 'Ngong Road, Nairobi',
  monthlyRent: '22000',
  deposit: '22000',
  availableFrom: 'April 15, 2026',
  description:
    'Good natural light, stable water, and a fast handover for someone moving within Nairobi.',
  amenities: 'Parking, water backup, caretaker, prepaid power',
  landlordPhone: '+254 711 020 304',
  moveReason: 'Relocating closer to work',
  photos: [],
};

export const initialMyListingRows: MyListingRow[] = [
  {
    id: 'kilimani-sunny-2br',
    title: 'Sunny 2BR handover near Yaya Centre',
    status: 'Live',
    views: '127',
    unlocks: '3',
    payout: 'KES 750 pending',
    updated: 'Updated 2h ago',
    reviewNote: 'Live and converting well in Kilimani searches.',
  },
  {
    id: 'south-b-studio',
    title: 'Budget studio close to CBD routes',
    status: 'Review',
    views: '18',
    unlocks: '0',
    payout: 'Waiting for publish',
    updated: 'Awaiting media check',
    reviewNote: 'Admin review is checking room coverage and GPS tags.',
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
    detail:
      'The platform waits out the seven-day hold period before releasing commission downstream.',
  },
];

export const walletPackages: WalletPackage[] = [
  {
    id: 'starter',
    label: 'Starter',
    credits: 2500,
    price: 'KES 2,500',
    bonus: '+0 bonus credits',
    description: 'Best for one verified unlock in the KES 20k to 25k range.',
  },
  {
    id: 'mover',
    label: 'Mover',
    credits: 5000,
    price: 'KES 5,000',
    bonus: '+250 bonus credits',
    description: 'Good if you want enough balance for two unlocks and confirmation follow-up.',
  },
  {
    id: 'power',
    label: 'Power',
    credits: 10000,
    price: 'KES 10,000',
    bonus: '+700 bonus credits',
    description: 'For heavy browsing across several neighborhoods without topping up again.',
  },
];

export const initialTransactions: TransactionRecord[] = [
  {
    id: 'txn-topup-001',
    type: 'topup',
    title: 'M-Pesa top-up',
    status: 'Completed',
    amount: 'KES 5,000',
    credits: '+5,000 credits',
    date: 'March 24, 2026',
    detail: 'Wallet top-up completed from +254 712 345 678.',
  },
  {
    id: 'txn-referral-001',
    type: 'referral',
    title: 'Referral reward',
    status: 'Completed',
    amount: 'KES 0',
    credits: '+250 credits',
    date: 'March 20, 2026',
    detail: 'Referral bonus credited after a friend completed their first payment.',
  },
];

export const initialNotifications: NotificationRecord[] = [
  {
    id: 'notif-001',
    title: 'Listing review updated',
    detail: 'Your South B studio is still in media review. Add one bathroom photo to speed approval.',
    time: '2h ago',
    target: { route: 'my-listings' },
  },
  {
    id: 'notif-002',
    title: 'Credits still available',
    detail: 'You have enough credits left for at least one mid-range unlock this week.',
    time: '5h ago',
    target: { route: 'credits' },
  },
  {
    id: 'notif-003',
    title: 'Westlands loft is trending',
    detail: 'The rooftop loft now has more saves and unlocks than yesterday.',
    time: 'Yesterday',
    target: { route: 'listing', id: 'westlands-loft' },
  },
];

export const initialSavedListingIds = ['westlands-loft'];

export const initialUnlocks: UnlockRecord[] = [];

export const initialSearchFilters: SearchFilters = {
  verifiedOnly: false,
  fastMove: false,
  selectedBudget: 'Any',
  selectedSize: 'Any',
  selectedArea: null,
};

export const initialUserProfile: UserProfile = {
  name: 'Amina Kamau',
  initials: 'AK',
  phone: '+254 712 345 678',
  preferredArea: 'Kilimani, Westlands',
  bio: 'Looking for clean, well-documented handovers with verified media.',
};

export const initialSettings: AppSettings = {
  pushNotifications: true,
  smsAlerts: true,
  savedSearchAlerts: true,
};

export const helpArticles = [
  {
    id: 'help-unlock',
    title: 'How unlock pricing works',
    body:
      'Unlock cost is 10 percent of the monthly rent. Re-opening the same listing after a successful unlock stays non-billable.',
  },
  {
    id: 'help-review',
    title: 'Why some new listings enter review first',
    body:
      'The first three listings from a poster go through admin review to check photo coverage, GPS evidence, and contact accuracy.',
  },
  {
    id: 'help-confirm',
    title: 'What happens after both sides confirm',
    body:
      'Commission eligibility starts only after both the incoming and outgoing tenant confirm the connection.',
  },
];

export const supportTopics = ['Unlock issue', 'Payment problem', 'Listing review', 'Payout question'];

export const reviewPrompts = [
  'Accurate photos',
  'Clear handover timing',
  'Responsive contact',
  'Worth the unlock',
];

export const updateNotes = [
  'Unified branded shell across auth, search, post, credits, and profile.',
  'Interactive unlock and confirmation state instead of static placeholders.',
  'Phone-friendly Expo Go flow on SDK 54.',
];

export const referralHighlights = [
  'Invite a friend and earn 250 credits when their first top-up completes.',
  'Referral credits land in the same wallet used for unlocks.',
  'Support can review missed rewards through the dispute flow.',
];

export const defaultReferralCode = 'PATA-AMINA';
