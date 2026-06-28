import { useAuth, useClerk, useUser } from '@clerk/expo';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ReceivedUnlockRecord, UnlockContactInfo } from '@pataspace/contracts';
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
import {
  createUnlock as createUnlockApi,
  confirmUnlock as confirmUnlockApi,
  fetchReceivedUnlocks as fetchReceivedUnlocksApi,
} from '@/lib/api/unlocks';
import { ApiRequestError } from '@/lib/api-client';
import { uploadAndConfirmPhoto, uploadAndConfirmVideo } from '@/lib/api/uploads';
import { createListing as createListingApi } from '@/lib/api/listings';
import { fetchCreditBalance, purchaseCredits } from '@/lib/api/credits';
import { createDispute as createDisputeApi } from '@/lib/api/disputes';
import { createSupportTicket as createSupportTicketApi } from '@/lib/api/support';
import { createReview as createReviewApi } from '@/lib/api/reviews';
import { createReferral as createReferralApi, fetchMyReferrals } from '@/lib/api/referrals';
import {
  fetchMySavedListings,
  saveListing as saveListingApi,
  unsaveListing as unsaveListingApi,
} from '@/lib/api/saved-listings';
import {
  ConfirmationSide,
  ListingHouseType,
  ListingStatus,
  type CreditPurchasePackage,
  type ReferralRecord,
} from '@pataspace/contracts';
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
  referrals: ReferralRecord[];
  rewardedReferralCount: number;
  getListingById: (id?: string | string[]) => ListingPreview | undefined;
  getUnlockRecord: (listingId?: string | string[]) => UnlockRecord | undefined;
  isListingSaved: (listingId: string) => boolean;
  isListingUnlocked: (listingId: string) => boolean;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setColorSchemePreference: (scheme: AppColorScheme) => void;
  toggleSaved: (listingId: string) => Promise<void>;
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
  confirmIncoming: (listingId: string) => Promise<'success' | 'already_confirmed' | 'error'>;
  receivedUnlocks: ReceivedUnlockRecord[];
  getReceivedUnlocksForListing: (listingId: string) => ReceivedUnlockRecord[];
  confirmReceivedUnlock: (unlockId: string) => Promise<'success' | 'already_confirmed' | 'error'>;
  refreshReceivedUnlocks: () => Promise<void>;
  submitSupportMessage: (topic: string, message: string) => Promise<'success' | 'error'>;
  submitReview: (rating: number, comment: string) => void;
  submitReviewForUnlock: (unlockId: string, rating: number, comment: string) => Promise<'success' | 'already_reviewed' | 'not_confirmed' | 'forbidden' | 'error'>;
  submitDispute: (subject: string, detail: string) => void;
  submitDisputeForUnlock: (unlockId: string, subject: string, detail: string) => Promise<'success' | 'already_filed' | 'error'>;
  sendReferralInvite: (phone: string) => Promise<'success' | 'already_invited' | 'self' | 'error'>;
  refreshReferrals: () => Promise<void>;
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
  const [receivedUnlocks, setReceivedUnlocks] = useState<ReceivedUnlockRecord[]>([]);
  const [listingContactInfoById, setListingContactInfoById] =
    useState<Record<string, UnlockContactInfo>>(initialUnlockContactInfoByListingId);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [searchFilters, setSearchFilters] = useState(initialSearchFilters);
  const colorScheme: AppColorScheme = nativeWindColorScheme === 'dark' ? 'dark' : 'light';
  const theme = mobileThemes[colorScheme];
  const isAuthenticated = isAuthLoaded && !!isSignedIn;

  useMobileApiSync(
    isAuthenticated,
    getToken,
    setListings,
    setWalletBalance,
    setTransactions,
    setUnlocks,
    setReceivedUnlocks,
    setMyListings,
    setReferrals,
    setSavedListingIds,
  );

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

  async function toggleSaved(listingId: string) {
    const wasSaved = savedListingIds.includes(listingId);
    // Optimistically flip — restore on failure
    setSavedListingIds((current) =>
      wasSaved ? current.filter((id) => id !== listingId) : [listingId, ...current],
    );
    try {
      if (wasSaved) {
        await unsaveListingApi(getToken, listingId);
      } else {
        await saveListingApi(getToken, listingId);
      }
    } catch {
      setSavedListingIds((current) =>
        wasSaved && !current.includes(listingId)
          ? [listingId, ...current]
          : current.filter((id) => id !== listingId),
      );
    }
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
      commissions: [],
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
      paymentMethod: 'mpesa',
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

  async function confirmIncoming(
    listingId: string,
  ): Promise<'success' | 'already_confirmed' | 'error'> {
    const unlock = unlocks.find((u) => u.listingId === listingId);
    if (!unlock) {
      return 'error';
    }
    try {
      await confirmUnlockApi(getToken, unlock.id, ConfirmationSide.INCOMING_TENANT);
      updateUnlock(listingId, { incomingConfirmed: true });
      return 'success';
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'ALREADY_CONFIRMED') {
        updateUnlock(listingId, { incomingConfirmed: true });
        return 'already_confirmed';
      }
      return 'error';
    }
  }

  function getReceivedUnlocksForListing(listingId: string) {
    return receivedUnlocks.filter((record) => record.listing.id === listingId);
  }

  async function refreshReceivedUnlocks() {
    if (!isAuthenticated) {
      return;
    }
    try {
      const response = await fetchReceivedUnlocksApi(getToken);
      setReceivedUnlocks(response.data);
    } catch {
      // leave the last known state in place on a transient failure
    }
  }

  async function confirmReceivedUnlock(
    unlockId: string,
  ): Promise<'success' | 'already_confirmed' | 'error'> {
    try {
      await confirmUnlockApi(getToken, unlockId, ConfirmationSide.OUTGOING_TENANT);
      setReceivedUnlocks((current) =>
        current.map((record) =>
          record.unlockId === unlockId ? { ...record, outgoingConfirmed: true } : record,
        ),
      );
      pushNotification({
        id: `notif-confirm-out-${Date.now()}`,
        title: 'Move-out confirmed',
        detail: 'Your side is confirmed. Commission unlocks once both sides agree.',
        time: 'Just now',
        target: { route: 'my-listings' },
      });
      void refreshReceivedUnlocks();
      return 'success';
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'ALREADY_CONFIRMED') {
        setReceivedUnlocks((current) =>
          current.map((record) =>
            record.unlockId === unlockId ? { ...record, outgoingConfirmed: true } : record,
          ),
        );
        return 'already_confirmed';
      }
      return 'error';
    }
  }

  async function submitSupportMessage(
    topic: string,
    message: string,
  ): Promise<'success' | 'error'> {
    try {
      await createSupportTicketApi(getToken, { subject: topic, message });
      pushNotification({
        id: `notif-support-${Date.now()}`,
        title: 'Support request logged',
        detail: `${topic} has been sent to the team.`,
        time: 'Just now',
        target: { route: 'profile' },
      });
      return 'success';
    } catch {
      return 'error';
    }
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

  async function submitReviewForUnlock(
    unlockId: string,
    rating: number,
    comment: string,
  ): Promise<'success' | 'already_reviewed' | 'not_confirmed' | 'forbidden' | 'error'> {
    const trimmed = comment.trim();
    try {
      await createReviewApi(getToken, {
        unlockId,
        rating,
        comment: trimmed.length > 0 ? trimmed : undefined,
      });
      pushNotification({
        id: `notif-review-${Date.now()}`,
        title: 'Thanks for the rating',
        detail: `Your ${rating}/5 review is recorded.`,
        time: 'Just now',
        target: { route: 'profile' },
      });
      return 'success';
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('already')) return 'already_reviewed';
      if (message.includes('confirm')) return 'not_confirmed';
      if (message.includes('not allowed') || message.includes('forbidden')) return 'forbidden';
      return 'error';
    }
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

  async function submitDisputeForUnlock(
    unlockId: string,
    subject: string,
    detail: string,
  ): Promise<'success' | 'already_filed' | 'error'> {
    const reason = `${subject}: ${detail.trim()}`;
    try {
      await createDisputeApi(getToken, { unlockId, reason });
      pushNotification({
        id: `notif-dispute-${Date.now()}`,
        title: 'Dispute filed',
        detail: `${subject} — admin review starts within 24 hours.`,
        time: 'Just now',
        target: { route: 'confirmations' },
      });
      return 'success';
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('already')) {
        return 'already_filed';
      }
      return 'error';
    }
  }

  async function sendReferralInvite(
    phone: string,
  ): Promise<'success' | 'already_invited' | 'self' | 'error'> {
    const normalized = normalizePhone(phone) || phone;
    try {
      const created = await createReferralApi(getToken, { phoneNumber: normalized });
      setReferrals((current) => [created, ...current.filter((entry) => entry.id !== created.id)]);
      pushNotification({
        id: `notif-referral-${Date.now()}`,
        title: 'Referral invite sent',
        detail: `Invite recorded for ${normalized}.`,
        time: 'Just now',
        target: { route: 'credits' },
      });
      return 'success';
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('already')) return 'already_invited';
      if (message.includes('refer yourself') || message.includes('cannot_refer_self')) return 'self';
      return 'error';
    }
  }

  async function refreshReferrals(): Promise<void> {
    try {
      const response = await fetchMyReferrals(getToken);
      setReferrals(response.data);
    } catch {
      // Silently ignore — stale list stays in place
    }
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
        referrals,
        rewardedReferralCount: referrals.filter((entry) => entry.status === 'REWARDED').length,
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
        receivedUnlocks,
        getReceivedUnlocksForListing,
        confirmReceivedUnlock,
        refreshReceivedUnlocks,
        submitSupportMessage,
        submitReview,
        submitReviewForUnlock,
        submitDispute,
        submitDisputeForUnlock,
        sendReferralInvite,
        refreshReferrals,
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
