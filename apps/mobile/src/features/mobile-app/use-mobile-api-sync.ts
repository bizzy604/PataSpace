/**
 * Purpose: Syncs real API data into the MobileAppProvider state on mount and sign-in.
 * Why important: Separates API-fetch side effects from the main provider component.
 * Used by: MobileAppProvider.
 */
import { useEffect } from 'react';
import { ListingStatus, TransactionStatus, TransactionType } from '@pataspace/contracts';
import type {
  CreditTransaction,
  ListingCard,
  MyListing,
  MyUnlockRecord,
  ReceivedUnlockRecord,
  ReferralRecord,
} from '@pataspace/contracts';
import { draftCameraSequence } from '@/data/media-library';
import {
  formatCredits,
  type ListingPreview,
  type MyListingRow,
  type TransactionRecord,
  type UnlockRecord,
} from '@/data/mock-listings';
import { fetchListings, fetchMyListings } from '@/lib/api/listings';
import { fetchCreditBalance, fetchTransactions } from '@/lib/api/credits';
import { fetchMyUnlocks, fetchAllReceivedUnlocks } from '@/lib/api/unlocks';
import { fetchMyReferrals } from '@/lib/api/referrals';
import { fetchMySavedListings } from '@/lib/api/saved-listings';

function listingCardToPreview(card: ListingCard): ListingPreview {
  const bedrooms = card.bedrooms;
  const bedLabel = bedrooms === 0 ? 'Studio' : bedrooms === 1 ? '1 bed' : `${bedrooms} bed`;
  const title =
    bedrooms === 0 ? `Studio · ${card.neighborhood}` : `${bedrooms}BR · ${card.neighborhood}`;

  return {
    id: card.id,
    title,
    monthlyRent: card.monthlyRent,
    price: `KES ${card.monthlyRent.toLocaleString()}/mo`,
    unlockCostCredits: card.unlockCostCredits,
    unlockCost: formatCredits(card.unlockCostCredits),
    successFeeKes: card.successFeeKes,
    commissionAmount: `KES ${Math.round(card.successFeeKes * 0.7).toLocaleString()}`,
    county: card.county,
    houseType: card.houseType,
    area: card.neighborhood,
    location: `${card.neighborhood}, ${card.county}`,
    directions: 'Directions revealed after unlock.',
    meta: `${bedLabel}  |  ${card.county}  |  ${card.furnished ? 'Furnished' : card.propertyType}`,
    blurb: `${card.propertyType} in ${card.neighborhood}. Available from ${card.availableFrom}.`,
    status: 'Live',
    coverImage: card.thumbnailUrl ? { uri: card.thumbnailUrl } : draftCameraSequence[0]!.source,
    photoCount: '— photos',
    imageHint: card.neighborhood,
    availableFrom: card.availableFrom,
    deposit: 'Contact for details',
    moveReason: '',
    tags: card.furnished ? ['Furnished'] : [],
    amenities: [],
    galleryMedia: [],
    mapLocation: card.mapLocation,
    quote: '',
    quoteAuthor: '',
    stats: {
      views: String(card.viewCount),
      unlocks: String(card.unlockCount),
      saves: '—',
      freshness: new Date(card.createdAt).toLocaleDateString('en-KE'),
    },
  };
}

function transactionTypeLabel(type: TransactionType): string {
  if (type === TransactionType.SPEND) return 'Listing unlock';
  if (type === TransactionType.REFUND) return 'Credit refund';
  if (type === TransactionType.BONUS) return 'Bonus credits';
  return 'Credit top-up';
}

export function creditTransactionToRecord(tx: CreditTransaction): TransactionRecord {
  const delta = tx.balanceAfter - tx.balanceBefore;
  const absAmount = Math.abs(tx.amount);
  const type: TransactionRecord['type'] =
    tx.type === TransactionType.SPEND
      ? 'unlock'
      : tx.type === TransactionType.REFUND
        ? 'support'
        : 'topup';

  return {
    id: tx.id,
    type,
    title: tx.description ?? transactionTypeLabel(tx.type),
    status: tx.status === TransactionStatus.COMPLETED ? 'Completed' : 'Pending',
    amount: `KES ${absAmount.toLocaleString()}`,
    credits: `${delta >= 0 ? '+' : ''}${delta.toLocaleString()} credits`,
    date: new Date(tx.createdAt).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    detail: tx.description ?? '',
  };
}

function apiUnlockToRecord(record: MyUnlockRecord): UnlockRecord {
  return {
    id: record.unlockId,
    listingId: record.listing.id,
    creditsSpent: record.creditsSpent,
    contactInfo: record.contactInfo,
    // History endpoint substitutes the masked line server-side; the client
    // cannot distinguish, so render neutrally until the next unlock refresh.
    contactMode: 'direct',
    contactExpiresAt: null,
    incomingConfirmed: record.myConfirmation !== null,
    outgoingConfirmed: record.tenantConfirmation !== null,
    createdAt: record.createdAt,
    holdUntil: '7 days after both confirmations',
  };
}

function apiMyListingToRow(listing: MyListing): MyListingRow {
  const status: MyListingRow['status'] =
    listing.status === ListingStatus.ACTIVE ||
    listing.status === ListingStatus.UNLOCKED ||
    listing.status === ListingStatus.CONFIRMED
      ? 'Live'
      : listing.status === ListingStatus.PENDING
        ? 'Review'
        : 'Closed';

  return {
    id: listing.id,
    title: listing.neighborhood,
    status,
    views: String(listing.viewCount),
    unlocks: String(listing.unlockCount),
    payout:
      listing.totalEarnings > 0
        ? `KES ${listing.totalEarnings.toLocaleString()} earned`
        : listing.pendingEarnings > 0
          ? `KES ${listing.pendingEarnings.toLocaleString()} pending`
          : 'No earnings yet',
    updated: new Date(listing.createdAt).toLocaleDateString('en-KE'),
    reviewNote:
      status === 'Live'
        ? 'Listing is active in the feed.'
        : status === 'Review'
          ? 'Awaiting admin review.'
          : 'Listing is no longer active.',
    commissions: listing.commissions.map((commission) => ({
      unlockId: commission.unlockId,
      amountKES: commission.amountKES,
      status: commission.status,
      eligibleAt: commission.eligibleAt,
      paidAt: commission.paidAt,
    })),
  };
}

export function useMobileApiSync(
  isAuthenticated: boolean,
  getToken: () => Promise<string | null>,
  setListings: (listings: ListingPreview[]) => void,
  setWalletBalance: (balance: number) => void,
  setTransactions: (records: TransactionRecord[]) => void,
  setUnlocks: (records: UnlockRecord[]) => void,
  setReceivedUnlocks: (records: ReceivedUnlockRecord[]) => void,
  setMyListings: (rows: MyListingRow[]) => void,
  setReferrals: (records: ReferralRecord[]) => void,
  setSavedListingIds: (ids: string[]) => void,
) {
  useEffect(() => {
    fetchListings()
      .then((response) => setListings(response.data.map(listingCardToPreview)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCreditBalance(getToken)
      .then((balance) => setWalletBalance(balance.balance))
      .catch(() => {});
    fetchTransactions(getToken)
      .then((response) => setTransactions(response.data.map(creditTransactionToRecord)))
      .catch(() => {});
    fetchMyUnlocks(getToken)
      .then((response) => setUnlocks(response.data.map(apiUnlockToRecord)))
      .catch(() => {});
    fetchAllReceivedUnlocks(getToken)
      .then((records) => setReceivedUnlocks(records))
      .catch(() => {});
    fetchMyListings(getToken)
      .then((listings) => setMyListings(listings.map(apiMyListingToRow)))
      .catch(() => {});
    fetchMyReferrals(getToken)
      .then((response) => setReferrals(response.data))
      .catch(() => {});
    fetchMySavedListings(getToken)
      .then((response) => setSavedListingIds(response.data.map((entry) => entry.listing.id)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}
