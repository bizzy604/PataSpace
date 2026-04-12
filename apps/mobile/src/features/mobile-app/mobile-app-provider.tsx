import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UnlockContactInfo } from '@pataspace/contracts';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import {
  buildUnlockContactInfo,
  confirmationStages,
  defaultReferralCode,
  draftCameraSequence,
  featuredListings,
  filterBudgetOptions,
  filterSizeOptions,
  formatListingHouseType,
  formatCredits,
  getListingById,
  helpArticles,
  initialDraft,
  initialMyListingRows,
  initialNotifications,
  initialSavedListingIds,
  initialSearchFilters,
  initialSettings,
  initialTransactions,
  initialUnlockContactInfoByListingId,
  initialUnlocks,
  initialUserProfile,
  listingFilters,
  neighborhoodSuggestions,
  onboardingSlides,
  photoCapturePrompts,
  referralHighlights,
  resolveApproximateMapLocation,
  reviewPrompts,
  supportTopics,
  updateNotes,
  walletPackages,
  type AppSettings,
  type ListingDraft,
  type ListingDraftPhoto,
  type ListingPreview,
  type MyListingRow,
  type NotificationRecord,
  type SearchFilters,
  type TransactionRecord,
  type UnlockRecord,
  type UserProfile,
  type WalletPackage,
} from '@/data/mock-listings';
import { mobileThemes, type AppColorScheme, type MobileThemePalette } from '@/lib/theme';

type PendingAuth = {
  name: string;
  phone: string;
};

type PendingTopUp = {
  packageId: string;
  phone: string;
};

type MobileAppContextValue = {
  colorScheme: AppColorScheme;
  theme: MobileThemePalette;
  isAuthenticated: boolean;
  user: UserProfile;
  settings: AppSettings;
  listings: ListingPreview[];
  browseListings: ListingPreview[];
  myListings: MyListingRow[];
  savedListings: ListingPreview[];
  savedListingIds: string[];
  walletBalance: number;
  transactions: TransactionRecord[];
  unlocks: UnlockRecord[];
  latestUnlock?: UnlockRecord;
  latestTopUp?: TransactionRecord;
  latestSubmittedListing?: MyListingRow;
  notifications: NotificationRecord[];
  pendingAuth: PendingAuth | null;
  pendingTopUp: PendingTopUp | null;
  draft: ListingDraft;
  searchFilters: SearchFilters;
  listingFilters: string[];
  neighborhoodSuggestions: string[];
  filterBudgetOptions: SearchFilters['selectedBudget'][];
  filterSizeOptions: SearchFilters['selectedSize'][];
  walletPackages: WalletPackage[];
  onboardingSlides: typeof onboardingSlides;
  photoCapturePrompts: string[];
  helpArticles: typeof helpArticles;
  supportTopics: string[];
  reviewPrompts: string[];
  updateNotes: string[];
  referralHighlights: string[];
  confirmationStages: typeof confirmationStages;
  referralCode: string;
  getListingById: (id?: string | string[]) => ListingPreview | undefined;
  getUnlockRecord: (listingId?: string | string[]) => UnlockRecord | undefined;
  isListingSaved: (listingId: string) => boolean;
  isListingUnlocked: (listingId: string) => boolean;
  beginRegistration: (name: string, phone: string) => void;
  verifyOtp: (code: string) => boolean;
  login: (phone: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setColorSchemePreference: (scheme: AppColorScheme) => void;
  toggleSaved: (listingId: string) => void;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  addDraftPhoto: (photo: ListingDraftPhoto) => void;
  removeDraftPhoto: (photoId: string) => void;
  updateDraft: (draft: Partial<ListingDraft>) => void;
  resetDraft: () => void;
  submitDraft: () => MyListingRow;
  selectTopUp: (packageId: string, phone: string) => void;
  completeTopUp: () => TransactionRecord | undefined;
  unlockListing: (listingId: string) => 'success' | 'already_unlocked' | 'insufficient';
  confirmIncoming: (listingId: string) => void;
  confirmOutgoing: (listingId: string) => void;
  submitSupportMessage: (topic: string, message: string) => void;
  submitReview: (rating: number, comment: string) => void;
  submitDispute: (subject: string, detail: string) => void;
  sendReferralInvite: (phone: string) => void;
};

const MobileAppContext = createContext<MobileAppContextValue | null>(null);

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('254')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+254${digits.slice(1)}`;
  }

  return phone.trim();
}

function toInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'PS';
}

function buildSubmittedListingDraftData(draft: ListingDraft, listingIndex: number) {
  const monthlyRent = Number(draft.monthlyRent) || 0;
  const listingId = `draft-listing-${Date.now()}`;
  const coverPhoto = draft.photos[0];
  const galleryMedia = draft.photos.map((photo) => ({
    id: photo.id,
    label: photo.label,
    source: photo.source,
  }));
  const unlockCostCredits = Math.round(monthlyRent * 0.1);
  const fallbackMapLocation = resolveApproximateMapLocation(draft.area || 'Kilimani', coverPhoto?.gps);
  const contactInfo = buildUnlockContactInfo(
    `${draft.location || 'Location pending'}, ${draft.county || 'Nairobi'}`,
    draft.landlordPhone || '+254 700 000 000',
    coverPhoto?.gps?.latitude,
    coverPhoto?.gps?.longitude,
  );

  const listingPreview = {
    id: listingId,
    title: draft.title || `Draft listing ${listingIndex}`,
    monthlyRent,
    price: `KES ${monthlyRent.toLocaleString()}/mo`,
    unlockCostCredits,
    unlockCost: formatCredits(unlockCostCredits),
    commissionAmount: `KES ${Math.round(unlockCostCredits * 0.3).toLocaleString()}`,
    county: draft.county || 'Nairobi',
    houseType: draft.houseType,
    area: draft.area || 'Nairobi',
    location: draft.location
      ? `${draft.location}, ${draft.county || 'Nairobi'}`
      : `Location pending, ${draft.county || 'Nairobi'}`,
    directions: 'Directions will appear after the listing is approved and unlocked.',
    meta: `${formatListingHouseType(draft.houseType)}  |  ${draft.county || 'Nairobi'}  |  Pending review`,
    blurb: draft.description || 'New listing draft awaiting review.',
    status: listingIndex <= 3 ? 'Review' : 'Live',
    coverImage: galleryMedia[0]?.source ?? draftCameraSequence[0].source,
    photoCount: `${galleryMedia.length} photos`,
    imageHint: galleryMedia[0]?.label ?? 'Awaiting final upload review.',
    availableFrom: draft.availableFrom || 'Available soon',
    deposit: draft.deposit ? `KES ${Number(draft.deposit).toLocaleString()}` : 'Deposit not set',
    moveReason: draft.moveReason || 'Move reason not provided',
    tags: (draft.amenities || 'New')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3),
    amenities: (draft.amenities || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    galleryMedia,
    mapLocation: fallbackMapLocation,
    quote: 'Listing draft submitted from mobile.',
    quoteAuthor: 'Outgoing tenant',
    stats: {
      views: '0',
      unlocks: '0',
      saves: '0',
      freshness: 'Just now',
    },
  } satisfies ListingPreview;

  return {
    listingPreview,
    contactInfo,
  };
}

export function MobileAppProvider({ children }: { children: ReactNode }) {
  const { colorScheme: nativeWindColorScheme, setColorScheme: setNativeWindColorScheme } =
    useNativeWindColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(initialUserProfile);
  const [settings, setSettings] = useState(initialSettings);
  const [listings, setListings] = useState(featuredListings);
  const [myListings, setMyListings] = useState(initialMyListingRows);
  const [savedListingIds, setSavedListingIds] = useState(initialSavedListingIds);
  const [walletBalance, setWalletBalance] = useState(5000);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [unlocks, setUnlocks] = useState(initialUnlocks);
  const [listingContactInfoById, setListingContactInfoById] =
    useState<Record<string, UnlockContactInfo>>(initialUnlockContactInfoByListingId);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [searchFilters, setSearchFilters] = useState(initialSearchFilters);
  const colorScheme: AppColorScheme = nativeWindColorScheme === 'dark' ? 'dark' : 'light';
  const theme = mobileThemes[colorScheme];

  const browseListings = listings.filter((listing) => listing.status !== 'Review' && listing.status !== 'Closed');
  const savedListings = browseListings.filter((listing) => savedListingIds.includes(listing.id));
  const latestUnlock = unlocks[0];
  const latestTopUp = transactions.find((transaction) => transaction.type === 'topup');
  const latestSubmittedListing = myListings[0];

  useEffect(() => {
    setNativeWindColorScheme(settings.colorScheme);
  }, [setNativeWindColorScheme, settings.colorScheme]);

  function pushNotification(notification: NotificationRecord) {
    setNotifications((current) => [notification, ...current]);
  }

  function getListing(id?: string | string[]) {
    return getListingById(listings, id);
  }

  function getUnlockRecord(listingId?: string | string[]) {
    const resolvedId = Array.isArray(listingId) ? listingId[0] : listingId;

    return unlocks.find((unlock) => unlock.listingId === resolvedId);
  }

  function beginRegistration(name: string, phone: string) {
    setPendingAuth({
      name: name.trim() || 'PataSpace User',
      phone: normalizePhone(phone),
    });
  }

  function verifyOtp(code: string) {
    if (code.trim().length < 4 || !pendingAuth) {
      return false;
    }

    setIsAuthenticated(true);
    setUser((current) => ({
      ...current,
      name: pendingAuth.name,
      initials: toInitials(pendingAuth.name),
      phone: pendingAuth.phone,
    }));
    setPendingAuth(null);

    return true;
  }

  function login(identifier: string) {
    const normalizedPhone = normalizePhone(identifier);

    setIsAuthenticated(true);
    setUser((current) => ({
      ...current,
      phone: identifier.includes('@') ? current.phone : normalizedPhone || current.phone,
    }));
  }

  function logout() {
    setIsAuthenticated(false);
  }

  function updateProfile(profile: Partial<UserProfile>) {
    setUser((current) => ({
      ...current,
      ...profile,
      initials: profile.name ? toInitials(profile.name) : current.initials,
    }));
  }

  function updateSettings(nextSettings: Partial<AppSettings>) {
    setSettings((current) => ({
      ...current,
      ...nextSettings,
    }));
  }

  function setColorSchemePreference(scheme: AppColorScheme) {
    updateSettings({ colorScheme: scheme });
  }

  function toggleSaved(listingId: string) {
    setSavedListingIds((current) =>
      current.includes(listingId)
        ? current.filter((id) => id !== listingId)
        : [listingId, ...current],
    );
  }

  function updateSearchFilters(filters: Partial<SearchFilters>) {
    setSearchFilters((current) => ({
      ...current,
      ...filters,
    }));
  }

  function resetSearchFilters() {
    setSearchFilters(initialSearchFilters);
  }

  function addDraftPhoto(photo: ListingDraftPhoto) {
    setDraft((current) => ({
      ...current,
      photos: [...current.photos, photo],
    }));
  }

  function removeDraftPhoto(photoId: string) {
    setDraft((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.id !== photoId),
    }));
  }

  function updateDraft(nextDraft: Partial<ListingDraft>) {
    setDraft((current) => ({
      ...current,
      ...nextDraft,
    }));
  }

  function resetDraft() {
    setDraft(initialDraft);
  }

  function submitDraft() {
    const { listingPreview, contactInfo } = buildSubmittedListingDraftData(draft, myListings.length + 1);
    const myListing: MyListingRow = {
      id: listingPreview.id,
      title: listingPreview.title,
      status: listingPreview.status === 'Live' ? 'Live' : 'Review',
      views: '0',
      unlocks: '0',
      payout: listingPreview.status === 'Live' ? 'KES 0 pending' : 'Waiting for publish',
      updated: 'Submitted just now',
      reviewNote:
        listingPreview.status === 'Live'
          ? 'Listing is live and ready for incoming tenants.'
          : 'Your first three listings stay in admin review before going live.',
    };

    setListings((current) => [listingPreview, ...current]);
    setMyListings((current) => [myListing, ...current]);
    setListingContactInfoById((current) => ({
      ...current,
      [listingPreview.id]: contactInfo,
    }));
    pushNotification({
      id: `notif-submit-${Date.now()}`,
      title: 'Listing submitted',
      detail:
        listingPreview.status === 'Live'
          ? 'Your listing is now live in the feed.'
          : 'Your listing is in review and will publish after media checks.',
      time: 'Just now',
      target: { route: 'my-listings' },
    });
    resetDraft();

    return myListing;
  }

  function selectTopUp(packageId: string, phone: string) {
    setPendingTopUp({
      packageId,
      phone: normalizePhone(phone) || user.phone,
    });
  }

  function completeTopUp() {
    if (!pendingTopUp) {
      return undefined;
    }

    const selectedPackage = walletPackages.find((item) => item.id === pendingTopUp.packageId);

    if (!selectedPackage) {
      return undefined;
    }

    const creditedAmount =
      selectedPackage.credits +
      Number(selectedPackage.bonus.replace(/\D/g, '') || '0');
    const transaction: TransactionRecord = {
      id: `txn-topup-${Date.now()}`,
      type: 'topup',
      title: `M-Pesa ${selectedPackage.label} package`,
      status: 'Completed',
      amount: selectedPackage.price,
      credits: `+${creditedAmount.toLocaleString()} credits`,
      date: 'Just now',
      detail: `Payment received from ${pendingTopUp.phone}.`,
    };

    setWalletBalance((current) => current + creditedAmount);
    setTransactions((current) => [transaction, ...current]);
    pushNotification({
      id: `notif-topup-${Date.now()}`,
      title: 'Credits added',
      detail: `${creditedAmount.toLocaleString()} credits are now available in your wallet.`,
      time: 'Just now',
      target: { route: 'credits' },
    });
    setPendingTopUp(null);

    return transaction;
  }

  function unlockListing(listingId: string) {
    const listing = getListing(listingId);

    if (!listing) {
      return 'insufficient';
    }

    if (unlocks.some((unlock) => unlock.listingId === listingId)) {
      return 'already_unlocked';
    }

    if (walletBalance < listing.unlockCostCredits) {
      return 'insufficient';
    }

    const contactInfo = listingContactInfoById[listingId];

    if (!contactInfo) {
      return 'insufficient';
    }

    const unlock: UnlockRecord = {
      id: `unlock-${Date.now()}`,
      listingId,
      creditsSpent: listing.unlockCostCredits,
      contactInfo,
      incomingConfirmed: false,
      outgoingConfirmed: false,
      createdAt: 'Just now',
      holdUntil: '7 days after both confirmations',
    };
    const transaction: TransactionRecord = {
      id: `txn-unlock-${Date.now()}`,
      type: 'unlock',
      title: `Unlock: ${listing.area}`,
      status: 'Completed',
      amount: listing.price,
      credits: `-${listing.unlockCostCredits.toLocaleString()} credits`,
      date: 'Just now',
      detail: `Contact details revealed for ${listing.title}.`,
    };

    setWalletBalance((current) => current - listing.unlockCostCredits);
    setUnlocks((current) => [unlock, ...current]);
    setTransactions((current) => [transaction, ...current]);
    pushNotification({
      id: `notif-unlock-${Date.now()}`,
      title: 'Contact revealed',
      detail: `You can now contact the outgoing tenant for ${listing.title}.`,
      time: 'Just now',
      target: { route: 'confirmations' },
    });

    return 'success';
  }

  function updateUnlock(listingId: string, updates: Partial<UnlockRecord>) {
    setUnlocks((current) =>
      current.map((unlock) =>
        unlock.listingId === listingId
          ? {
              ...unlock,
              ...updates,
            }
          : unlock,
      ),
    );
  }

  function confirmIncoming(listingId: string) {
    updateUnlock(listingId, { incomingConfirmed: true });
  }

  function confirmOutgoing(listingId: string) {
    updateUnlock(listingId, { outgoingConfirmed: true });
  }

  function submitSupportMessage(topic: string, message: string) {
    const transaction: TransactionRecord = {
      id: `txn-support-${Date.now()}`,
      type: 'support',
      title: `Support request: ${topic}`,
      status: 'Pending',
      amount: 'KES 0',
      credits: '0 credits',
      date: 'Just now',
      detail: message,
    };

    setTransactions((current) => [transaction, ...current]);
    pushNotification({
      id: `notif-support-${Date.now()}`,
      title: 'Support request logged',
      detail: `${topic} has been sent to the team.`,
      time: 'Just now',
      target: { route: 'profile' },
    });
  }

  function submitReview(rating: number, comment: string) {
    pushNotification({
      id: `notif-review-${Date.now()}`,
      title: 'Thanks for the rating',
      detail: `You submitted a ${rating}/5 review${comment ? ' with comments' : ''}.`,
      time: 'Just now',
      target: { route: 'profile' },
    });
  }

  function submitDispute(subject: string, detail: string) {
    pushNotification({
      id: `notif-dispute-${Date.now()}`,
      title: 'Dispute submitted',
      detail: `${subject}: ${detail}`,
      time: 'Just now',
      target: { route: 'credits' },
    });
  }

  function sendReferralInvite(phone: string) {
    pushNotification({
      id: `notif-referral-${Date.now()}`,
      title: 'Referral invite sent',
      detail: `Invite sent to ${normalizePhone(phone) || phone}.`,
      time: 'Just now',
      target: { route: 'credits' },
    });
  }

  return (
    <MobileAppContext.Provider
      value={{
        colorScheme,
        theme,
        isAuthenticated,
        user,
        settings,
        listings,
        browseListings,
        myListings,
        savedListings,
        savedListingIds,
        walletBalance,
        transactions,
        unlocks,
        latestUnlock,
        latestTopUp,
        latestSubmittedListing,
        notifications,
        pendingAuth,
        pendingTopUp,
        draft,
        searchFilters,
        listingFilters,
        neighborhoodSuggestions,
        filterBudgetOptions,
        filterSizeOptions,
        walletPackages,
        onboardingSlides,
        photoCapturePrompts,
        helpArticles,
        supportTopics,
        reviewPrompts,
        updateNotes,
        referralHighlights,
        confirmationStages,
        referralCode: defaultReferralCode,
        getListingById: getListing,
        getUnlockRecord,
        isListingSaved: (listingId: string) => savedListingIds.includes(listingId),
        isListingUnlocked: (listingId: string) =>
          unlocks.some((unlock) => unlock.listingId === listingId),
        beginRegistration,
        verifyOtp,
        login,
        logout,
        updateProfile,
        updateSettings,
        setColorSchemePreference,
        toggleSaved,
        updateSearchFilters,
        resetSearchFilters,
        addDraftPhoto,
        removeDraftPhoto,
        updateDraft,
        resetDraft,
        submitDraft,
        selectTopUp,
        completeTopUp,
        unlockListing,
        confirmIncoming,
        confirmOutgoing,
        submitSupportMessage,
        submitReview,
        submitDispute,
        sendReferralInvite,
      }}
    >
      {children}
    </MobileAppContext.Provider>
  );
}

export function useMobileApp() {
  const context = useContext(MobileAppContext);

  if (!context) {
    throw new Error('useMobileApp must be used inside MobileAppProvider');
  }

  return context;
}
