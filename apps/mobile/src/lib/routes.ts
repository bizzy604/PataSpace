import type { Href } from 'expo-router';

export type MyListingsFilter = 'active' | 'pending' | 'unlocks';

export const appRoutes = {
  home: '/',
  onboarding: '/onboarding',
  register: '/register',
  verifyOtp: '/verify-otp',
  login: '/login',
  ssoCallback: '/sso-callback',
  browse: '/browse',
  search: '/search',
  filters: '/filters',
  map: '/map',
  saved: '/saved',
  notifications: '/notifications',
  createListing: '/create-listing',
  createListingPhotos: '/create-listing-photos',
  createListingDetails: '/create-listing-details',
  createListingReview: '/create-listing-review',
  listingSubmitted: '/listing-submitted',
  myListings: '/my-listings',
  myListing: '/my-listing',
  unlock: '/unlock',
  contactRevealed: '/contact-revealed',
  confirmations: '/confirmations',
  confirmationSuccess: '/confirmation-success',
  credits: '/credits',
  buyCredits: '/buy-credits',
  mpesaProcessing: '/mpesa-processing',
  paymentSuccess: '/payment-success',
  transactions: '/transactions',
  profile: '/profile',
  editProfile: '/edit-profile',
  settings: '/settings',
  helpCenter: '/help-center',
  contactSupport: '/contact-support',
  rateReview: '/rate-review',
  appUpdate: '/app-update',
  dispute: '/dispute',
  referral: '/referral',
} as const;

export function listingHref(id: string): Href {
  return {
    pathname: '/listing',
    params: { id },
  };
}

export function listingGalleryHref(id: string): Href {
  return {
    pathname: '/listing-gallery',
    params: { id },
  };
}

export function listingStatsHref(id: string): Href {
  return {
    pathname: '/listing-stats',
    params: { id },
  };
}

export function unlockHref(id: string): Href {
  return {
    pathname: '/unlock',
    params: { id },
  };
}

export function contactRevealedHref(id: string): Href {
  return {
    pathname: '/contact-revealed',
    params: { id },
  };
}

export function transactionHref(id: string): Href {
  return {
    pathname: '/transaction',
    params: { id },
  };
}

export function myListingsHref(filter?: MyListingsFilter): Href {
  if (!filter) {
    return appRoutes.myListings;
  }

  return {
    pathname: '/my-listings',
    params: { filter },
  };
}

export function myListingHref(id: string): Href {
  return {
    pathname: '/my-listing',
    params: { id },
  };
}
