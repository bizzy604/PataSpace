/**
 * Purpose: Syncs real API data into the MobileAppProvider state and exposes
 *   visible loading/error state plus explicit refresh actions.
 * Why important: Remote failures must leave the app empty and retryable, never
 *   silently fall back to demo listings, balances, or saved homes.
 * Used by: MobileAppProvider and the Home, My Listings, and Saved screens.
 */
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { ListingStatus, TransactionStatus, TransactionType } from '@pataspace/contracts';
import type {
  CreditTransaction,
  MyListing,
  MyUnlockRecord,
  ReceivedUnlockRecord,
  ReferralRecord,
  SavedListingRecord,
} from '@pataspace/contracts';
import type {
  ListingPreview,
  MyListingRow,
  TransactionRecord,
  UnlockRecord,
} from '@/data/mock-listings';
import { listingCardToPreview } from '@/lib/listings/listing-preview';
import { fetchListings, fetchMyListings } from '@/lib/api/listings';
import { fetchCreditBalance, fetchTransactions } from '@/lib/api/credits';
import { fetchMyUnlocks, fetchAllReceivedUnlocks } from '@/lib/api/unlocks';
import { fetchMyReferrals } from '@/lib/api/referrals';
import { fetchMySavedListings } from '@/lib/api/saved-listings';
import {
  beginRemoteRequest,
  completeRemoteRequest,
  failRemoteRequest,
  initialRemoteResourceState,
  type RemoteResourceState,
} from '@/lib/remote-data-state';

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

export function savedRecordsToPreviews(records: SavedListingRecord[]): ListingPreview[] {
  return records.map((record) => listingCardToPreview(record.listing));
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
  setSavedListings: (listings: ListingPreview[]) => void,
) {
  const [feedState, setFeedState] = useState<RemoteResourceState>(initialRemoteResourceState);
  const [myListingsState, setMyListingsState] = useState<RemoteResourceState>(initialRemoteResourceState);
  const [savedListingsState, setSavedListingsState] = useState<RemoteResourceState>(initialRemoteResourceState);

  const refreshListings = useCallback(async () => {
    setFeedState(beginRemoteRequest);
    try {
      const response = await fetchListings();
      setListings(response.data.map(listingCardToPreview));
      setFeedState(completeRemoteRequest());
    } catch (error) {
      setFeedState((current) => failRemoteRequest(current, error));
    }
  }, [setListings]);

  const refreshMyListings = useCallback(async () => {
    if (!isAuthenticated) return;

    setMyListingsState(beginRemoteRequest);
    try {
      const listings = await fetchMyListings(getToken);
      setMyListings(listings.map(apiMyListingToRow));
      setMyListingsState(completeRemoteRequest());
    } catch (error) {
      setMyListingsState((current) => failRemoteRequest(current, error));
    }
  }, [getToken, isAuthenticated, setMyListings]);

  const refreshSavedListings = useCallback(async () => {
    if (!isAuthenticated) return;

    setSavedListingsState(beginRemoteRequest);
    try {
      const response = await fetchMySavedListings(getToken);
      setSavedListingIds(response.data.map((entry) => entry.listing.id));
      setSavedListings(savedRecordsToPreviews(response.data));
      setSavedListingsState(completeRemoteRequest());
    } catch (error) {
      setSavedListingsState((current) => failRemoteRequest(current, error));
    }
  }, [getToken, isAuthenticated, setSavedListingIds, setSavedListings]);

  const refreshAuthenticatedData = useCallback(async () => {
    if (!isAuthenticated) return;

    await Promise.all([
      fetchCreditBalance(getToken)
        .then((balance) => setWalletBalance(balance.balance))
        .catch(() => undefined),
      fetchTransactions(getToken)
        .then((response) => setTransactions(response.data.map(creditTransactionToRecord)))
        .catch(() => undefined),
      fetchMyUnlocks(getToken)
        .then((response) => setUnlocks(response.data.map(apiUnlockToRecord)))
        .catch(() => undefined),
      fetchAllReceivedUnlocks(getToken)
        .then((records) => setReceivedUnlocks(records))
        .catch(() => undefined),
      fetchMyReferrals(getToken)
        .then((response) => setReferrals(response.data))
        .catch(() => undefined),
      refreshMyListings(),
      refreshSavedListings(),
    ]);
  }, [
    getToken,
    isAuthenticated,
    refreshMyListings,
    refreshSavedListings,
    setReceivedUnlocks,
    setReferrals,
    setTransactions,
    setUnlocks,
    setWalletBalance,
  ]);

  useEffect(() => {
    void refreshListings();
  }, [refreshListings]);

  useEffect(() => {
    void refreshAuthenticatedData();
  }, [refreshAuthenticatedData]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;

      void refreshListings();
      void refreshAuthenticatedData();
    });

    return () => subscription.remove();
  }, [refreshAuthenticatedData, refreshListings]);

  return {
    feedState,
    myListingsState,
    savedListingsState,
    refreshListings,
    refreshMyListings,
    refreshSavedListings,
  };
}
