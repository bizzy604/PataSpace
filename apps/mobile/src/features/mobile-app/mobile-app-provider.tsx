import { useAuth, useClerk, useUser } from '@clerk/expo';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UnlockContactInfo } from '@pataspace/contracts';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import {
  confirmationStages,
  defaultReferralCode,
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
import { createUnlock as createUnlockApi, confirmUnlock as confirmUnlockApi } from '@/lib/api/unlocks';
import { uploadAndConfirmPhoto, uploadAndConfirmVideo } from '@/lib/api/uploads';
import { createListing as createListingApi } from '@/lib/api/listings';
import { fetchCreditBalance, purchaseCredits } from '@/lib/api/credits';
import { ConfirmationSide, ListingHouseType, ListingStatus, type CreditPurchasePackage } from '@pataspace/contracts';
import { useMobileApiSync } from './use-mobile-api-sync';

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
  logout: () => Promise<void>;
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
  submitDraft: () => Promise<MyListingRow>;
  selectTopUp: (packageId: string, phone: string) => void;
  completeTopUp: () => TransactionRecord | undefined;
  initiatePurchase: (packageId: string, phone: string) => Promise<void>;
  refreshWallet: () => Promise<void>;
  unlockListing: (listingId: string) => Promise<'success' | 'already_unlocked' | 'insufficient'>;
  confirmIncoming: (listingId: string) => Promise<void>;
  confirmOutgoing: (listingId: string) => Promise<void>;
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

function readUnsafeMetadataString(value: unknown, key: string) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const metadataValue = (value as Record<string, unknown>)[key];

  return typeof metadataValue === 'string' && metadataValue.trim() ? metadataValue.trim() : null;
}

function resolveDisplayName(
  value: { fullName?: string | null; firstName?: string | null; lastName?: string | null },
  metadataName?: string | null,
) {
  const fullName = value.fullName?.trim();

  if (fullName) {
    return fullName;
  }

  const fallback = [value.firstName, value.lastName].filter(Boolean).join(' ').trim();

  return fallback || metadataName || initialUserProfile.name;
}

function houseTypeToBedrooms(houseType: ListingHouseType): number {
  if (houseType === ListingHouseType.STUDIO) return 0;
  if (houseType === ListingHouseType.BEDSITTER || houseType === ListingHouseType.ONE_BEDROOM) return 1;
  if (houseType === ListingHouseType.TWO_BEDROOM) return 2;
  if (houseType === ListingHouseType.THREE_BEDROOM) return 3;
  if (houseType === ListingHouseType.FOUR_BEDROOM_PLUS) return 4;
  return 5;
}

function houseTypeToBathrooms(houseType: ListingHouseType): number {
  if (
    houseType === ListingHouseType.STUDIO ||
    houseType === ListingHouseType.BEDSITTER ||
    houseType === ListingHouseType.ONE_BEDROOM ||
    houseType === ListingHouseType.TWO_BEDROOM
  ) {
    return 1;
  }
  return 2;
}

export function MobileAppProvider({ children }: { children: ReactNode }) {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { colorScheme: nativeWindColorScheme, setColorScheme: setNativeWindColorScheme } =
    useNativeWindColorScheme();
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
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [searchFilters, setSearchFilters] = useState(initialSearchFilters);
  const colorScheme: AppColorScheme = nativeWindColorScheme === 'dark' ? 'dark' : 'light';
  const theme = mobileThemes[colorScheme];
  const isAuthenticated = isAuthLoaded && !!isSignedIn;

  useMobileApiSync(isAuthenticated, getToken, setListings, setWalletBalance, setTransactions, setUnlocks, setMyListings);

  const browseListings = listings.filter((listing) => listing.status !== 'Review' && listing.status !== 'Closed');
  const savedListings = browseListings.filter((listing) => savedListingIds.includes(listing.id));
  const latestUnlock = unlocks[0];
  const latestTopUp = transactions.find((transaction) => transaction.type === 'topup');
  const latestSubmittedListing = myListings[0];

  useEffect(() => {
    setNativeWindColorScheme(settings.colorScheme);
  }, [setNativeWindColorScheme, settings.colorScheme]);

  useEffect(() => {
    if (!isAuthenticated || !clerkUser) {
      setUser(initialUserProfile);
      return;
    }

    const metadataFirstName = readUnsafeMetadataString(clerkUser.unsafeMetadata, 'firstName');
    const metadataLastName = readUnsafeMetadataString(clerkUser.unsafeMetadata, 'lastName');
    const metadataName = [metadataFirstName, metadataLastName].filter(Boolean).join(' ').trim();
    const displayName = resolveDisplayName(clerkUser, metadataName);
    const metadataPhone = readUnsafeMetadataString(clerkUser.unsafeMetadata, 'phone');
    const primaryPhoneNumber =
      clerkUser.primaryPhoneNumber?.phoneNumber && clerkUser.primaryPhoneNumber.phoneNumber.trim()
        ? normalizePhone(clerkUser.primaryPhoneNumber.phoneNumber)
        : null;

    setUser((current) => ({
      ...current,
      name: displayName,
      initials: toInitials(displayName),
      phone:
        (metadataPhone ? normalizePhone(metadataPhone) : null) ??
        primaryPhoneNumber ??
        current.phone ??
        initialUserProfile.phone,
    }));
  }, [clerkUser, isAuthenticated]);

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

  async function logout() {
    await signOut();
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

  async function submitDraft(): Promise<MyListingRow> {
    const coverPhoto = draft.photos[0];
    if (!coverPhoto) throw new Error('At least one photo is required');

    const listingGps = coverPhoto.gps;
    if (!listingGps) throw new Error('GPS data is required. Retake the cover photo with location enabled.');

    const confirmedPhotos: Array<{ s3Key: string; url: string; gps: NonNullable<typeof listingGps>; index: number }> = [];
    for (let i = 0; i < draft.photos.length; i++) {
      const photo = draft.photos[i]!;
      const uri = typeof photo.source === 'object' && 'uri' in photo.source ? photo.source.uri : null;
      if (!uri) continue;
      const confirmed = await uploadAndConfirmPhoto(getToken, uri, i);
      confirmedPhotos.push({ s3Key: confirmed.s3Key, url: confirmed.url, gps: photo.gps ?? listingGps, index: i });
    }
    if (confirmedPhotos.length === 0) throw new Error('No photos could be uploaded');

    let videoInput: { s3Key: string; url: string } | undefined;
    if (draft.video?.uri) {
      const confirmed = await uploadAndConfirmVideo(getToken, draft.video.uri);
      videoInput = { s3Key: confirmed.s3Key, url: confirmed.url };
    }

    const monthlyRent = Number(draft.monthlyRent) || 0;
    const amenities = (draft.amenities || '').split(',').map((a) => a.trim()).filter(Boolean);
    const parsedDate = draft.availableFrom ? new Date(draft.availableFrom) : null;
    const availableFrom = parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const description = draft.description.trim().length >= 20
      ? draft.description.trim()
      : `${formatListingHouseType(draft.houseType)} in ${draft.area || 'Nairobi'}, available from ${draft.availableFrom || 'soon'}.`;

    const response = await createListingApi(getToken, {
      county: draft.county || 'Nairobi',
      neighborhood: draft.area || 'Nairobi',
      address: draft.location || `${draft.area || 'Nairobi'}, ${draft.county || 'Nairobi'}`,
      latitude: listingGps.latitude,
      longitude: listingGps.longitude,
      monthlyRent,
      bedrooms: houseTypeToBedrooms(draft.houseType),
      bathrooms: houseTypeToBathrooms(draft.houseType),
      houseType: draft.houseType,
      propertyType: 'Apartment',
      furnished: false,
      description,
      amenities: amenities.length > 0 ? amenities : ['To be confirmed'],
      availableFrom,
      photos: confirmedPhotos.map((p, i) => ({
        s3Key: p.s3Key,
        url: p.url,
        order: i + 1,
        latitude: p.gps.latitude,
        longitude: p.gps.longitude,
        takenAt: p.gps.timestamp ? new Date(p.gps.timestamp).toISOString() : undefined,
      })),
      video: videoInput,
    });

    const isLive = response.status === ListingStatus.ACTIVE;
    const myListing: MyListingRow = {
      id: response.id,
      title: draft.title || `${formatListingHouseType(draft.houseType)} in ${draft.area}`,
      status: isLive ? 'Live' : 'Review',
      views: '0',
      unlocks: '0',
      payout: isLive ? 'KES 0 pending' : 'Waiting for publish',
      updated: 'Submitted just now',
      reviewNote: isLive
        ? 'Listing is live and ready for incoming tenants.'
        : 'Your listing is in review and will publish after media checks.',
    };

    setMyListings((current) => [myListing, ...current]);
    pushNotification({
      id: `notif-submit-${Date.now()}`,
      title: 'Listing submitted',
      detail: myListing.reviewNote,
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

  async function initiatePurchase(packageId: string, phone: string): Promise<void> {
    const normalizedPhone = normalizePhone(phone) || user.phone;
    setPendingTopUp({ packageId, phone: normalizedPhone });
    await purchaseCredits(getToken, {
      package: packageId as CreditPurchasePackage,
      phoneNumber: normalizedPhone,
    });
  }

  async function refreshWallet(): Promise<void> {
    try {
      const balance = await fetchCreditBalance(getToken);
      setWalletBalance(balance.balance);
    } catch {
      // Silently ignore — stale balance stays in place
    }
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

  async function unlockListing(listingId: string): Promise<'success' | 'already_unlocked' | 'insufficient'> {
    const listing = getListing(listingId);
    if (!listing) return 'insufficient';
    if (unlocks.some((unlock) => unlock.listingId === listingId)) return 'already_unlocked';
    if (walletBalance < listing.unlockCostCredits) return 'insufficient';

    try {
      const response = await createUnlockApi(getToken, listingId);
      const contactInfo = response.contactInfo;
      const unlock: UnlockRecord = {
        id: response.unlockId,
        listingId,
        creditsSpent: response.creditsSpent,
        contactInfo,
        incomingConfirmed: false,
        outgoingConfirmed: false,
        createdAt: new Date().toISOString(),
        holdUntil: '7 days after both confirmations',
      };
      setWalletBalance(response.newBalance);
      setUnlocks((current) => [unlock, ...current]);
      setListingContactInfoById((current) => ({ ...current, [listingId]: contactInfo }));
      pushNotification({
        id: `notif-unlock-${Date.now()}`,
        title: 'Contact revealed',
        detail: `You can now contact the outgoing tenant for ${listing.title}.`,
        time: 'Just now',
        target: { route: 'confirmations' },
      });
      return 'success';
    } catch {
      return 'insufficient';
    }
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

  async function confirmIncoming(listingId: string) {
    const unlock = unlocks.find((u) => u.listingId === listingId);
    if (unlock) {
      await confirmUnlockApi(getToken, unlock.id, ConfirmationSide.INCOMING_TENANT).catch(() => {});
    }
    updateUnlock(listingId, { incomingConfirmed: true });
  }

  async function confirmOutgoing(listingId: string) {
    const unlock = unlocks.find((u) => u.listingId === listingId);
    if (unlock) {
      await confirmUnlockApi(getToken, unlock.id, ConfirmationSide.OUTGOING_TENANT).catch(() => {});
    }
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
        initiatePurchase,
        refreshWallet,
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
