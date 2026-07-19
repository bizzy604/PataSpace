/**
 * Purpose: Fetches the full listing detail (photos, video, amenities,
 *   description) for a listing id and exposes it with loading/error state.
 * Why important: The browse feed only carries a thumbnail; this hook is how
 *   detail and gallery screens obtain the real media the poster uploaded.
 * Used by: ListingDetailsScreen, ListingGalleryScreen, MyListingDetailsScreen.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ListingDetails } from '@pataspace/contracts';
import { useAuthSession } from '@/features/auth/auth-provider';
import { fetchListingById } from '@/lib/api/listings';

export function useListingDetails(id?: string | string[]) {
  const { getToken } = useAuthSession();
  const resolvedId = Array.isArray(id) ? id[0] : id;
  const [details, setDetails] = useState<ListingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    if (!resolvedId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchListingById(resolvedId, getToken)
      .then((response) => {
        if (cancelled) return;
        setDetails(response);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load listing');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // getToken is a stable provider callback; re-running on identity churn
    // would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedId, attempt]);

  return { details, loading, error, retry };
}
